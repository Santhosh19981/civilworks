# InfraMart - Construction Materials & Equipment Rental App

A premium, offline-first Ionic Angular mobile application for buying construction materials and renting heavy equipment.

## 🎨 Features

✅ **Complete Offline Functionality** - Works without internet connection
✅ **Premium UI/UX** - Modern construction-themed design with brand colors
✅ **Product Catalog** - Browse and search construction materials
✅ **Equipment Rental** - View and contact equipment rental services
✅ **Shopping Cart** - Add items, manage quantities
✅ **Mock Authentication** - OTP-based login (use 1234)
✅ **Checkout Flow** - Address form, payment options (Pay Now / COD)
✅ **Order Tracking** - Real-time status updates (Packing → Shipping → Delivered)
✅ **Smooth Animations** - Professional transitions and micro-interactions

## 🎨 Brand Colors

- **Primary Orange**: `#F7931E`
- **Deep Navy Blue**: `#0B2C4D`
- **Helmet Yellow**: `#FFC107`
- **White**: `#FFFFFF`
- **Light Gray**: `#F5F6F8`

## 📱 Pages & Features

### Home
- Auto-sliding banner carousel
- CTA buttons (Buy Products / Rent Equipment)
- Featured products horizontal scroll
- Popular rentals section
- Pull-to-refresh

### Buy Products
- Search functionality
- Category filter chips
- Grid layout with product cards
- Product detail page with quantity selector
- Add to cart with toast notifications

### Equipment Rental
- Search rentals
- Grid layout
- Rental detail page
- Floating call button (tel: link)

### Cart
- Item management (add/remove/update quantity)
- Auto-calculated totals
- Empty cart state
- Proceed to checkout

### Checkout Flow
1. **Login** - Mobile/Email + OTP (1234)
2. **Checkout** - Address form with validation
3. **Payment** - Pay Now / Cash on Delivery
4. **Order Success** - Confirmation with order ID

### Orders
- Order history
- Status timeline (Packing → Shipping → Delivered)
- Automatic status progression simulation
- Empty state

### Profile
- User information display
- Logout functionality

## 🚀 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Ionic CLI

### Setup

1. **Install dependencies**
```bash
cd "d:/Ionic Projects/civilworks"
npm install
```

2. **Install Ionic CLI globally** (if not already installed)
```bash
npm install -g @ionic/cli
```

3. **Run the app**
```bash
ionic serve
```

The app will open at `http://localhost:8100`

## 📱 Build for Mobile

### Android
```bash
ionic capacitor add android
ionic capacitor sync android
ionic capacitor run android
```

### iOS
```bash
ionic capacitor add ios
ionic capacitor sync ios
ionic capacitor open ios
```

## 🖼️ Adding Images

The app requires the following images to be added to `src/assets/images/`:

### Logo
- `logo.png` - App logo (180x180px minimum)

### Banners (16:9 ratio, 1200x675px recommended)
- `banners/banner1.jpg` - Construction materials
- `banners/banner2.jpg` - Heavy equipment
- `banners/banner3.jpg` - Build your dreams theme

### Product Images (Square, 500x500px recommended)
- `products/cement.jpg`
- `products/steel-bars.jpg`
- `products/bricks.jpg`
- `products/sand.jpg`
- `products/aggregates.jpg`
- `products/helmet.jpg`
- `products/drill.jpg`
- `products/concrete-blocks.jpg`
- `products/steel-angle.jpg`
- `products/gloves.jpg`
- `products/white-cement.jpg`
- `products/tape.jpg`

### Rental Equipment Images (Square, 500x500px recommended)
- `rentals/excavator.jpg`
- `rentals/crane.jpg`
- `rentals/mixer.jpg`
- `rentals/scaffolding.jpg`
- `rentals/generator.jpg`
- `rentals/compactor.jpg`
- `rentals/boom-lift.jpg`
- `rentals/concrete-pump.jpg`
- `rentals/dumper.jpg`
- `rentals/welding.jpg`

### App Icons
Place in `src/assets/icon/`:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`
- `favicon.png`

**Note**: You can use placeholder images initially or download construction-themed images from free stock photo sites like Unsplash, Pexels, or Pixabay.

## 📦 Project Structure

```
civilworks/
├── src/
│   ├── app/
│   │   ├── models/          # TypeScript interfaces
│   │   ├── services/        # State management services
│   │   ├── pages/           # All page components
│   │   ├── tabs/            # Tab navigation
│   │   ├── app-routing.module.ts
│   │   └── app.module.ts
│   ├── assets/
│   │   └── images/          # App images
│   ├── data/
│   │   ├── products.json    # Product catalog
│   │   └── rentals.json     # Rental equipment
│   ├── theme/
│   │   └── variables.scss   # Brand colors & theme
│   └── global.scss          # Global styles
├── package.json
├── angular.json
├── capacitor.config.ts
└── ionic.config.json
```

## 🔧 Tech Stack

- **Framework**: Ionic 7 + Angular 17
- **Language**: TypeScript
- **State Management**: RxJS BehaviorSubject
- **Storage**: localStorage
- **Mobile**: Capacitor 5
- **Styling**: SCSS + Ionic Components

## 🎯 Key Services

- **ProductService** - Manages product catalog from JSON
- **RentalService** - Manages rental equipment from JSON
- **CartService** - Shopping cart with localStorage persistence
- **OrderService** - Order management with status simulation
- **AuthService** - Mock authentication (OTP: 1234)

## 🧪 Testing

### Mock Login
- Use any phone number or email
- OTP: `1234`

### Order Status Simulation
- Orders automatically progress:
  - Packing (0-10 seconds)
  - Shipping (10-30 seconds)
  - Delivered (after 30 seconds)

## 📝 License

This is a demo application created for educational purposes.

## 🤝 Contributing

This is a standalone demo project. Feel free to fork and customize for your needs.

## 📧 Support

For issues or questions, please refer to the Ionic documentation:
- [Ionic Framework Docs](https://ionicframework.com/docs)
- [Angular Docs](https://angular.io/docs)
- [Capacitor Docs](https://capacitorjs.com/docs)
