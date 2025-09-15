# Chatify – A Discord Clone

An original **Discord-inspired chat application** built with **Next.js**, **MongoDB**, and **Firebase OAuth**.
Chatify brings real-time communication to the web with authentication, scalable data storage, and a familiar Discord-like user interface.

🔗 **Live Demo:** [chatifyorg.vercel.app](https://chatifyorg.vercel.app/)

---

## 🚀 Features

* 🔐 **Secure Authentication** – Sign in with Google using Firebase OAuth.
* 💬 **Real-Time Chat** – Seamless messaging experience inspired by Discord.
* 📂 **MongoDB Integration** – Robust data persistence for users, servers, and messages.
* 🌐 **Next.js** – Server-side rendering for performance and scalability.
* 🎨 **Modern UI/UX** – A clean, responsive, and familiar chat interface.

---

## 🛠️ Tech Stack

<div align="left">  
  <img src="https://skillicons.dev/icons?i=nextjs,mongodb,firebase,typescript,tailwind,vercel,git,github" />  
</div>  

* **Frontend:** Next.js + TailwindCSS
* **Backend:** Next.js API Routes with MongoDB
* **Authentication:** Firebase OAuth
* **Deployment:** Vercel

---

## 📂 Project Structure

```
├── components     # Reusable UI components  
├── lib            # Configurations (Firebase, MongoDB, etc.)  
├── pages          # Next.js pages (auth, chat, etc.)  
├── public         # Static assets  
├── styles         # Global styles  
└── utils          # Helper functions  
```

---

## 🔧 Getting Started

1. **Clone the repo:**

   ```bash
   git clone https://github.com/your-username/chatify.git
   cd chatify
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file and add:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   MONGODB_URI=your_mongodb_connection_string
   ```

4. **Run the development server:**

   ```bash
   npm run dev
   ```

---

## 🤝 Contributing

Contributions are welcome! Feel free to fork the repo, submit pull requests, or open issues for suggestions and bugs.
