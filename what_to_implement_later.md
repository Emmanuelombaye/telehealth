# Future Implementation Plan: The Yucca-Style Conversion Funnel

This document outlines the high-fidelity, highly-dynamic UI/UX features that we will implement next to maximize patient conversion and establish a premium, authentic medical brand aesthetic.

## 1. Dynamic Hero Landing Section (Premium Medical Brand Aesthetic)
*   **Visual Structure:** A large, immersive hero section featuring high-quality, relatable models in the foreground (e.g., a man and woman in fitness or lifestyle attire).
*   **Dynamic Typography:** Mixed typography headers. For example: a stylized, orange, cursive-like font for the condition (e.g., *"Muscle Recovery"*) paired with clean, bold, white sans-serif text (*"treatment that works"*).
*   **Floating UI Elements:** Background glassmorphic elements and badges floating behind the models (e.g., audio/graph waves, transparent pill-shaped tags saying "Curb hunger" or "Weight loss support").
*   **Dual CTA Buttons:** 
    *   A glowing white pill button showcasing entry pricing (e.g., "Lose weight for just $146/mo*").
    *   A primary dark navy pill button ("Explore Treatments >").

## 2. Step 1: The Treatment Selection Page (`/quiz/select-treatment`)
*   **Trust Banner:** A top bar featuring a "Trustpilot Excellent 5-Stars (1000+ Reviews)" badge.
*   **Progress Indicator:** A sleek horizontal progress bar.
*   **Selection Cards:** Large, clickable cards for categories like Weight Loss, Longevity, and Muscle Recovery.
    *   Each card features the actual medication vial images on the right.
    *   Subtle, colored pill-badges (e.g., purple `Tirzepatide`, green `NAD+`).
    *   Pricing text ("As low as $146/mo").
    *   Active/Hover states featuring a colored border ring.
*   **Dynamic Bottom CTA:** A large, floating dark navy button that updates based on selection (e.g., "Choose Weight Loss →").

## 3. Step 2: The Dynamic Social Proof & Reviews Page (`/quiz/[condition]/reviews`)
*   **Dynamic Rendering:** The entire page seamlessly swaps content (images, headers, text) based on what the user selected in Step 1.
    *   *Weight Loss:* Shows heavy-to-slim transformations.
    *   *Hair Loss:* Shows balding-to-full-hair transformations.
    *   *Muscle Recovery:* Shows unfit-to-toned transformations.
*   **Before & After Cards:** Side-by-side images featuring an orange "Before" badge and a green "After" badge, plus a verified patient name and demographic badge (e.g., "58 years" or "Lost ~50 lbs").
*   **Trustpilot Review Carousel:** 
    *   Placed directly beneath the Before/After card.
    *   Features a title ("Exceptional experience is our top priority!").
    *   A swipeable/clickable carousel of 5-star review cards containing bold titles, review snippets, and timestamps.
*   **Transition CTA:** A massive, dark navy "Continue →" button to move the user to the final step.

## 4. Step 3: Clinical Intake (Basic Questionnaire)
*   The final destination after clicking "Continue" on the Reviews page.
*   Drops the user directly into the medical questionnaire specific to the condition they chose, ensuring a frictionless transition from marketing/social proof to actual clinical onboarding.
