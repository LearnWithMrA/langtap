const fs = require('fs')

const bgPath = 'components/animation/LandscapeBackgroundV2.tsx'
const svgPath = 'components/animation/Group.svg'

const bgCode = fs.readFileSync(bgPath, 'utf8')
const svgCode = fs.readFileSync(svgPath, 'utf8')

const pathMatch = svgCode.match(/<path\s+d="([^"]+)"/)
if (!pathMatch) {
  console.error('No path found in Group.svg')
  process.exit(1)
}
const svgPathD = pathMatch[1]

const replacement = `        {/* User provided custom Shrub vector Group.svg overlaid automatically */}
        <svg x="-10" y="220" width="1620" height="180" viewBox="0 0 4434 1203" preserveAspectRatio="none">
          <path d="${svgPathD}" style={{ fill: 'var(--scene-ground)', filter: 'brightness(0.6) saturate(1.2)' }} />
        </svg>`

const targetRegex =
  /\{\/\* TONS of Shrubs on Dark Green Grass \*\/\}[\s\S]*?<BushCluster1 x=\{1500\} y=\{280\} \/>/

if (bgCode.match(targetRegex)) {
  const updatedCode = bgCode.replace(targetRegex, replacement)
  fs.writeFileSync(bgPath, updatedCode)
  console.log('Successfully replaced the shrubs block with the Group.svg vector!')
} else {
  console.error('Target block not found in LandscapeBackgroundV2.tsx!')
  process.exit(1)
}
