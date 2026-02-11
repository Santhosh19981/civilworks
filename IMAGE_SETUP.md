# Image Placeholder Instructions

Due to image generation service limitations, you'll need to add images manually to complete the app.

## Quick Setup with Placeholder Images

For testing, you can use solid color placeholders:

### Create placeholder directories:
```bash
mkdir -p src/assets/images/banners
mkdir -p src/assets/images/products
mkdir -p src/assets/images/rentals
mkdir -p src/assets/icon
```

### Option 1: Use Online Placeholder Services

You can use services like:
- https://via.placeholder.com/500x500/F7931E/FFFFFF?text=Product
- https://via.placeholder.com/1200x675/0B2C4D/FFFFFF?text=Banner

### Option 2: Download Free Stock Images

Recommended sources:
- **Unsplash**: https://unsplash.com/s/photos/construction
- **Pexels**: https://www.pexels.com/search/construction/
- **Pixabay**: https://pixabay.com/images/search/construction/

### Required Images:

#### Logo (180x180px)
- `src/assets/images/logo.png`
- Search for: "construction logo" or create a simple icon

#### Banners (1200x675px)
- `src/assets/images/banners/banner1.jpg` - Construction materials
- `src/assets/images/banners/banner2.jpg` - Heavy equipment  
- `src/assets/images/banners/banner3.jpg` - Construction site

#### Products (500x500px each)
Search terms on stock photo sites:
- cement bags
- steel rods/TMT bars
- red bricks
- construction sand
- stone aggregates
- safety helmet
- power drill
- concrete blocks
- steel angle
- work gloves
- white cement
- measuring tape

#### Rentals (500x500px each)
Search terms:
- excavator
- tower crane
- concrete mixer
- scaffolding
- diesel generator
- plate compactor
- boom lift
- concrete pump
- dumper truck
- welding machine

#### App Icons
Use an online icon generator:
- https://icon.kitchen/
- Upload your logo and generate all sizes

## Testing Without Images

The app will still work without images - you'll just see broken image placeholders. All functionality will work perfectly.

## Pro Tip

For a quick professional look:
1. Use Canva (free) to create branded images
2. Use the brand colors: Orange (#F7931E), Navy (#0B2C4D), Yellow (#FFC107)
3. Add construction-themed icons from Canva's library
