class ChatClient {
  constructor(userId) {
    this.userId = userId;
    this.socket = io();
    this.initialize();
  }

  initialize() {
    this.socket.on("connect", () => {
      this.socket.emit("register", this.userId);
    });

    // Handle incoming messages
    this.socket.on("private-message", this.handleIncomingMessage.bind(this));
    this.socket.on("message-status", this.handleMessageStatus.bind(this));
    this.socket.on("user-online", this.handleUserOnline.bind(this));
    this.socket.on("user-offline", this.handleUserOffline.bind(this));

    // Restore pending messages
    this.restorePendingMessages();
    setInterval(() => this.retryPendingMessages(), 5000);
  }

  // Message storage in IndexedDB
  async storeMessage(message) {
    const db = await this.getDB();
    const tx = db.transaction("messages", "readwrite");
    const store = tx.objectStore("messages");
    store.put(message);
  }

  async getDB() {
    if (!this.db) {
      this.db = await new Promise((resolve) => {
        const request = indexedDB.open("chatDB", 1);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains("messages")) {
            const store = db.createObjectStore("messages", {
              keyPath: "messageId",
            });
            store.createIndex("byConversation", ["from", "to"]);
            store.createIndex("status", "status");
          }
        };

        request.onsuccess = (event) => resolve(event.target.result);
      });
    }
    return this.db;
  }

  async sendMessage(to, content) {
    const messageId =
      Date.now() + "-" + Math.random().toString(36).substr(2, 9);
    const message = {
      messageId,
      from: this.userId,
      to,
      content,
      timestamp: Date.now(),
      status: "sending",
    };

    await this.storeMessage(message);
    this.socket.emit("private-message", { to, messageId, content });
    this.updateUI(message);
  }

  async handleIncomingMessage({ from, messageId, content, timestamp }) {
    const message = {
      messageId,
      from,
      to: this.userId,
      content,
      timestamp,
      status: "delivered",
    };

    await this.storeMessage(message);
    this.updateUI(message);
  }

  async handleMessageStatus({ messageId, status }) {
    const db = await this.getDB();
    const tx = db.transaction("messages", "readwrite");
    const store = tx.objectStore("messages");
    const request = store.get(messageId);

    request.onsuccess = (event) => {
      const message = event.target.result;
      if (message) {
        message.status = status;
        store.put(message);
        this.updateUI(message);
      }
    };
  }

  async retryPendingMessages() {
    const db = await this.getDB();
    const tx = db.transaction("messages", "readonly");
    const store = tx.objectStore("messages");
    const index = store.index("status");
    const request = index.getAll("sending");

    request.onsuccess = (event) => {
      event.target.result.forEach((message) => {
        this.socket.emit("private-message", {
          to: message.to,
          messageId: message.messageId,
          content: message.content,
        });
      });
    };
  }

  handleUserOnline(userId) {
    // Update UI to show user is online
    console.log(`${userId} is online`);
  }

  handleUserOffline(userId) {
    // Update UI to show user is offline
    console.log(`${userId} is offline`);
  }

  updateUI(message) {
    // Implement your UI update logic here
    console.log("Message update:", message);
  }
}

// Usage
const currentUser = "user123"; // Replace with actual user ID
const chatClient = new ChatClient(currentUser);
