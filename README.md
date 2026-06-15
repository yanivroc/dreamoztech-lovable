# DreamozTech + Lovable App Frontend Showcase

Welcome to the frontend companion app for **DreamozTech**! This project demonstrates how seamlessly you can use the DreamozTech free API to power a dynamic, content-driven website (including user profiles, blogs, and product listings) with a frontend built completely in Lovable.

🔗 **Live Demo:** [https://dreamoztech.lovable.app/](https://dreamoztech.lovable.app/)  
🔗 **Backend Platform:** [https://dreamoztech.com](https://dreamoztech.com)

---

## 🚀 Getting Started

This project is a blueprint for developers, creators, and no-code builders who want a fast, reliable, and completely free Headless CMS backend for their Lovable applications. 

To ensure a smooth setup, **you must configure your content backend first** before integrating it with Lovable.

### 📋 Step 0: Prerequisites (Content Setup First)

1. **Create Your Content Base:** Before jumping into Lovable, you need to set up your backend content. Create a free account directly here:  
   👉 **[Sign up on DreamozTech](https://dreamoztech.com/sign-up)**
   
2. **Populate Your Data:** Once signed up, take a minute to set up your profile and create a few sample blog posts or products. This ensures you have live data ready to be pulled by the API.

3. **Get Your Lovable Credits:** Once your DreamozTech content is ready, sign up for Lovable using our official partner invitation link to score **free creation credits**:  
   👉 **[Sign up on Lovable for Free Credits](https://lovable.dev/invite/KLS57OQ)**

---

## 🛠️ Step-by-Step Integration Guide

### Step 1: Get Your API Key
1. Log into your dashboard at [DreamozTech.com](https://dreamoztech.com).
2. Go to your settings/profile page and copy your unique **DreamozTech API Key**.

### Step 2: Clone or Import This Repository to Lovable
1. Fork or clone this repository to your own GitHub account.
2. Log into your [Lovable Dashboard](https://lovable.dev/invite/KLS57OQ).
3. Click on **New Project**, choose **Import from GitHub**, and select this repository.

### Step 3: Connect Your API Key
1. Once your project loads in Lovable, open the environment variables configuration or the API configuration file (typically found in your fetch/services layer).
2. Paste your **DreamozTech API Key** into the designated variable field:
```env
   VITE_DREAMOZTECH_API_KEY="your_api_key_here"
