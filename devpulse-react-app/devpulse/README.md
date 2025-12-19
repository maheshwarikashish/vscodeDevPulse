# DevPulse: Your Personal Coding Assistant

DevPulse helps you understand your coding habits by tracking your "coding rhythm." It monitors when you start and end coding sessions, tracks your breaks, and integrates with your GitHub commit activity to provide a comprehensive view of your productivity.

## 🚀 The Big Idea
DevPulse is a lightweight, privacy-focused tool designed for developers. By logging your work directly from VS Code, you feed data into a secure personal dashboard that visualizes your activity, helping you optimize your workflow.

---

## 🛠 Features

### 1. The VS Code Extension (Your Control Center)
The primary touchpoint for logging your activity. Use simple commands via the Command Palette (`Cmd+Shift+P` on Mac or `Ctrl+Shift+P` on Windows):

* **DevPulse: Sign In**: Connects your VS Code to your Firebase account securely.
* **DevPulse: Start Session**: Run this when you begin a deep work block.
* **DevPulse: End Session**: Run this when you finish coding.
* **DevPulse: Log Break**: Track your downtime (coffee, lunch, etc.) to see how it affects your focus.

### 2. The Web Dashboard
Visit your personalized dashboard at [https://code-45577.web.app](https://code-45577.web.app) to see your "Visual Report Card," including:
* **Daily Activity Charts**: Visualized breakdown of coding vs. breaks using Chart.js.
* **Average Session Length**: Identify how long your typical deep-work block lasts.
* **Productivity Score**: A custom score based on focus time, breaks, and streaks.
* **GitHub Integration**: A timeline of your recent public commits.

---

## 🔒 Security & Data
* **Firebase Authentication**: Handles secure sign-ins; your data is tied only to your unique ID.
* **Firestore Database**: A secure, real-time "online notebook" that stores your sessions and personal configurations.
* **Firebase Hosting**: Ensures your dashboard is served over a secure HTTPS connection.

---

## 💻 For Developers: Emulator vs. Live
DevPulse is built with a flexible environment:
* **Development**: We use the **Firebase Emulator** for a local "sandbox" environment. This allows for safe, cost-free testing without affecting production data.
* **Production**: When deployed, the app connects to the **Live Firebase** project to store and retrieve your actual coding history.

---

## 📦 How to Use
1. Install the extension from the VS Code Marketplace.
2. Sign in using the `DevPulse: Sign In` command.
3. Start a session and begin coding!
4. Check your progress anytime on the [Web Dashboard](https://code-45577.web.app).

---
*Built with ❤️ for developers who want to find their flow.*