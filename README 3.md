# Word Filter PWA

A Progressive Web App (PWA) for filtering word lists using binary input. This application allows users to filter through the EN-UK dictionary by making binary choices (YES/NO) for each letter of the alphabet.

## Features

- **PWA Functionality**: Installable, offline-capable web app
- **Binary Filtering**: Filter words through A-Z letter choices
- **Real-time Results**: See filtered results as you progress
- **Export Functionality**: Download filtered word lists as text files
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Dark Theme**: Clean black and white interface

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd grail-binary
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## PWA Installation

1. Open the app in a modern browser (Chrome, Firefox, Safari, Edge)
2. Look for the install prompt in the address bar or menu
3. Click "Install" to add the app to your home screen
4. The app will work offline and provide a native app experience

## Usage

### Homepage
- View available word lists (currently EN-UK Dictionary)
- Click "Perform" to start filtering
- Access settings via the gear icon

### Filter Screen
- **Top 50%**: Results area showing filtered words
  - Left side: Words matching left pattern
  - Right side: Words matching right pattern
  - Export buttons for each result set
  - Color-coded backgrounds (green = fewer words, red = more words)

- **Bottom 50%**: Binary input interface
  - Left button: YES choice
  - Center: Current letter (A-Z)
  - Right button: NO choice
  - Progress indicator showing current letter position

### Settings
- Configure export preferences
- Set default filename
- Toggle timestamp inclusion
- Clear cache and reset app
- View PWA information

## Binary Filtering Logic

The app filters words based on your binary choices for each letter:

1. Start with letter A
2. For each letter, choose YES or NO
3. The app shows two possible interpretations:
   - **Left Pattern**: YES choices = include letter, NO choices = exclude letter
   - **Right Pattern**: NO choices = include letter, YES choices = exclude letter
4. Progress through all 26 letters (A-Z)
5. Export your preferred result set

## File Structure

```
grail-binary/
├── src/
│   ├── components/          # Reusable UI components
│   ├── context/            # React context for state management
│   ├── data/               # Word list data and utilities
│   ├── pages/              # Page components
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # App entry point
│   └── index.css          # Global styles
├── wordlist/
│   └── EN-UK.txt          # Word list file (to be uploaded)
├── public/                 # Static assets
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── README.md             # This file
```

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **PWA**: Vite PWA Plugin
- **State Management**: React Context + useReducer

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding Word Lists

1. Place your word list file in the `wordlist/` directory
2. Update `src/data/wordLists.ts` to include the new list
3. The app will automatically load and cache the word list

### Customization

- **Colors**: Modify `tailwind.config.js` for theme colors
- **Layout**: Adjust component styles in `src/index.css`
- **PWA**: Update `vite.config.ts` for manifest settings

## License

This project is open source and available under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues or questions, please open an issue on the repository. 