# App Icon Generation Guide for Lokal

## Required App Icon Sizes

### iPhone Icons
- **20x20@2x**: 40x40 pixels
- **20x20@3x**: 60x60 pixels
- **29x29@2x**: 58x58 pixels
- **29x29@3x**: 87x87 pixels
- **40x40@2x**: 80x80 pixels
- **40x40@3x**: 120x120 pixels
- **60x60@2x**: 120x120 pixels
- **60x60@3x**: 180x180 pixels

### iPad Icons
- **20x20@1x**: 20x20 pixels
- **20x20@2x**: 40x40 pixels
- **29x29@1x**: 29x29 pixels
- **29x29@2x**: 58x58 pixels
- **40x40@1x**: 40x40 pixels
- **40x40@2x**: 80x80 pixels
- **76x76@1x**: 76x76 pixels
- **76x76@2x**: 152x152 pixels
- **83.5x83.5@2x**: 167x167 pixels

### App Store Icon
- **1024x1024**: 1024x1024 pixels

## Design Guidelines

### Visual Requirements
- **No transparency**: App icons must be fully opaque
- **No alpha channel**: Use RGB color space only
- **Square format**: All icons must be square
- **Safe area**: Keep important elements within the safe area (about 80% of the icon)
- **No rounded corners**: iOS will automatically apply rounded corners

### Design Elements
- **Brand**: Include the Lokal logo prominently
- **Colors**: Use the app's accent color (#4B5AF0 for light mode, #7A7AFF for dark mode)
- **Typography**: Use clear, readable fonts
- **Simplicity**: Keep the design simple and recognizable at small sizes

### Recommended Design
```
┌─────────────────┐
│                 │
│    ┌───────┐    │
│    │ 🎥📱  │    │
│    │ LOKAL │    │
│    └───────┘    │
│                 │
│                 │
└─────────────────┘
```

## Generation Tools

### Online Tools
1. **App Icon Generator**: https://appicon.co/
2. **MakeAppIcon**: https://makeappicon.com/
3. **Icon Kitchen**: https://icon.kitchen/

### Design Software
1. **Sketch**: Professional design tool
2. **Figma**: Free online design tool
3. **Adobe Illustrator**: Vector-based design
4. **Photoshop**: Raster-based design

## Implementation Steps

### 1. Create Base Icon
- Design a 1024x1024 pixel icon
- Use RGB color space (no alpha channel)
- Save as PNG format

### 2. Generate All Sizes
- Use one of the online tools above
- Upload your 1024x1024 icon
- Download the generated icon set

### 3. Add to Xcode Project
1. Open `Assets.xcassets` in Xcode
2. Select `AppIcon`
3. Drag and drop each icon to its corresponding slot
4. Verify all slots are filled

### 4. Test on Device
- Build and run on different devices
- Verify icons display correctly
- Check both light and dark modes

## Color Palette

### Primary Colors
- **Light Mode Accent**: #4B5AF0 (RGB: 75, 90, 240)
- **Dark Mode Accent**: #7A7AFF (RGB: 122, 122, 255)

### Supporting Colors
- **Background**: #FFFFFF (white) / #000000 (black)
- **Text**: #000000 (black) / #FFFFFF (white)
- **Secondary**: #6C757D (gray)

## Accessibility Considerations

### Contrast
- Ensure sufficient contrast between elements
- Test with color blindness simulators
- Use high contrast mode testing

### Recognition
- Icon should be recognizable at 20x20 pixels
- Avoid complex details that won't scale down
- Test on actual devices

## Testing Checklist

- [ ] All required sizes generated
- [ ] No transparency or alpha channel
- [ ] Square format maintained
- [ ] Safe area respected
- [ ] High contrast and readability
- [ ] Recognizable at small sizes
- [ ] Works in light and dark modes
- [ ] Tested on actual devices
- [ ] App Store icon meets requirements

## Troubleshooting

### Common Issues
1. **Transparency**: Remove any alpha channel
2. **Wrong format**: Use PNG, not JPEG
3. **Wrong size**: Ensure exact pixel dimensions
4. **Rounded corners**: Don't add them manually
5. **Color space**: Use RGB, not CMYK

### Validation
- Use Apple's App Store Connect validation
- Test on multiple device types
- Verify in both orientations 