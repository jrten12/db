# Dealbreak iOS App Store Submission Checklist

## Pre-Submission Requirements

### App Configuration
- [x] Bundle ID: `com.dealbreak.simulator`
- [x] Version: `2.0.0`
- [x] Build Number: `1`
- [x] App Name: `Dealbreak`
- [x] Subtitle: `Real Estate Investment Simulator`
- [x] Privacy Manifest: iOS 17+ privacy API declarations added

### Required Assets
- [ ] App Icon (1024x1024px, no transparency, no rounded corners)
- [ ] Splash Screen (1284x2778px for iPhone, dark theme)
- [ ] App Store Screenshots:
  - [ ] 6.7" iPhone (1290x2796px) - at least 3
  - [ ] 6.5" iPhone (1284x2778px) - at least 3
  - [ ] 12.9" iPad Pro (2048x2732px) - if supporting iPad

### Privacy & Permissions

#### Privacy Label Declarations
Data NOT Collected:
- Contact Info
- Financial Info (app simulates, doesn't collect real data)
- Health & Fitness
- Location
- Browsing History
- Search History

Data Collected:
- [ ] Diagnostics (crash logs) - "Data not linked to user"
- [ ] Usage Data (gameplay metrics) - "Data not linked to user"

#### Permission Descriptions (for future features)
- Network Access: Required for game saves and property data (no prompt needed)
- Notifications (if added): "Dealbreak uses notifications to remind you about in-game rental income. No personal data collected."

### App Store Review Guidelines Compliance

#### 4.2 Minimum Functionality
- [x] App provides educational gameplay value
- [x] Native UI components used throughout
- [x] No WebViews for core functionality
- [x] Full game loop: browse → investigate → analyze → buy → manage → results

#### 4.7 HTML5 Games, Bots, etc.
- [x] Game logic runs natively, not in WebView
- [x] No remote JavaScript execution

#### 5.1.1 Data Collection and Storage
- [x] Game data stored on user's server
- [x] No third-party analytics without disclosure
- [x] No unauthorized data collection
- [x] iOS 17 Privacy Manifest included

#### 5.1.2 Data Use and Sharing
- [x] No selling of user data
- [x] Clear privacy policy

### Technical Validation
- [ ] No crashes on launch
- [ ] Graceful error handling when network unavailable
- [ ] No memory leaks during extended play
- [ ] Proper handling of app lifecycle (background/foreground)
- [ ] Accessibility: VoiceOver support for key elements

### Content
- [ ] Age Rating: 4+ (no objectionable content)
- [ ] No gambling mechanics (simulated investments are educational)
- [ ] Education > Simulation category appropriate

## App Screens

1. **Landing** - Start new game, continue saved game, features overview
2. **Game (Market)** - Property listings with real-time stats bar
3. **Game (Portfolio)** - Active deals with status tracking
4. **Property Detail** - Due diligence, strategy selection, contractor choice
5. **Pro Forma** - Financial analysis with LTV slider and projected returns
6. **Deal Management** - Rehab progress, rental income, sell/flip actions
7. **Results** - Win/loss summary with deal breakdown and performance stats

## Build Commands

```bash
# Install dependencies
cd mobile && npm install

# Build for iOS (requires Apple Developer account)
npx eas build --platform ios --profile production

# Submit to App Store
npx eas submit --platform ios --profile production
```

## App Store Connect Setup

1. Create App in App Store Connect
2. Fill in app metadata:
   - Name: Dealbreak
   - Subtitle: Real Estate Investment Simulator
   - Description: [See below]
   - Keywords: real estate, investing, simulator, education, property, finance, pro forma, flip, rental
   - Category: Games > Simulation
   - Secondary: Education

### App Description (Draft)

```
Master real estate investing through hands-on deal analysis!

Dealbreak is an educational simulator that teaches you how professional investors evaluate properties. Start with $80,000 and 52 weeks to complete 3 profitable deals.

LEARN BY DOING
- Build pro forma financial models for each property
- Calculate NOI, cap rates, and cash-on-cash returns
- Understand the relationship between leverage and risk

CONDUCT DUE DILIGENCE
- Order market studies to reveal true rent potential
- Get property inspections to uncover hidden issues
- Analyze comparable sales for accurate valuations

MAKE STRATEGIC DECISIONS
- Choose between rental income or fix-and-flip strategies
- Balance time vs. cost with contractor selection
- Navigate changing market conditions
- Manage your capital and timeline wisely

TRACK YOUR PORTFOLIO
- Monitor active deals and rental income
- Watch rehab progress in real-time
- Sell properties at the right time

Perfect for:
- Aspiring real estate investors
- Finance students
- Anyone curious about property investing
```

## Post-Submission

- [ ] Monitor App Store Connect for review status
- [ ] Prepare for potential reviewer questions
- [ ] Have demo account ready if needed (not applicable - no login)
