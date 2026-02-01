# Server-Side Mockup Engine Implementation Notes

## Dependencies

The implementation uses:
- **ag-psd**: For parsing PSD files
- **sharp**: For image processing and compositing
- **canvas**: Required by ag-psd for reading image data

Install with:
```bash
npm install ag-psd sharp canvas
```

## How It Works

1. **PSD Parsing**: Uses `ag-psd` to read the PSD file structure and image data
2. **Layer Finding**: Recursively searches for Smart Object layers matching the provided names
3. **Image Processing**: Uses `sharp` to resize the design image to fit the Smart Object bounds
4. **Compositing**: Composites the design image onto the PSD composite at the correct position
5. **Export**: Exports the final image in the requested format (JPG/PNG)

## Smart Object Detection

The engine looks for layers that:
- Match one of the provided layer names (case-insensitive)
- Are marked as placed layers (Smart Objects in ag-psd)

Layer names tried by default:
- `YOUR DESIGN HERE`
- `Design Here`
- `Design`

## PSD Requirements

For best results, your PSD files should:
- Have a flattened composite image (ag-psd reads this)
- Use Smart Objects for the design placeholder
- Have the Smart Object layer named clearly (one of the default names or specify custom)

## Troubleshooting

### "Smart Object layer not found"
- Check that your PSD has a layer with one of the expected names
- Verify the layer is actually a Smart Object in Photoshop
- Try adding your layer name to the `smartObjectLayerNames` array

### "PSD does not contain composite image data"
- The PSD may need to be flattened or saved with composite image data
- Try opening and re-saving the PSD in Photoshop with "Maximize Compatibility" enabled

### Canvas/Image extraction issues
- Ensure `canvas` package is installed (required by ag-psd)
- Check that the PSD file is valid and not corrupted
- Try with a simpler PSD first to verify the setup

## Performance Considerations

- Large PSD files may take time to parse
- Image compositing is memory-intensive for high-resolution files
- Consider adding file size limits for production use

## Future Enhancements

- Support for multiple Smart Objects in one PSD
- Layer transform/rotation support
- Blending mode preservation
- Support for adjustment layers
