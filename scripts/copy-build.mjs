// Copies the single-file build to the project root as "100IndicaShop.html" for easy sharing.
import { copyFileSync } from 'node:fs'
copyFileSync('dist/index.html', '100IndicaShop.html')
console.log('\n  Ready: "100IndicaShop.html" (double-click to open)\n')
