# JOURNEY TIMELINE ENHANCEMENT

IMPORTANT

Redesign the timeline progression system in JOURNEY.html.

The current timeline uses a static vertical line with multiple circles that all appear active at the same time.

The goal is to create a more immersive journey experience that visually shows progression as the user scrolls.

---

INSPIRATION

Combine these two concepts:

1. Timeline Progress System

   * Vertical timeline connecting all milestones.
   * Progress should move from top to bottom.
   * Timeline should visually indicate current position.

2. Active Node Glow System

   * Only the currently focused milestone should glow.
   * Previous milestones should appear completed.
   * Upcoming milestones should remain inactive.

---

DESIRED BEHAVIOR

When the user scrolls:

FIRST MILESTONE

* Circle glows with burgundy accent.
* Timeline line fills downward until the next milestone.
* Current card receives subtle highlight.

SECOND MILESTONE

* First milestone becomes completed.
* Second milestone becomes active.
* Glow moves from first circle to second circle.
* Progress line extends between first and second milestone.

THIRD MILESTONE

* First and second milestones remain completed.
* Third milestone glows.
* Progress line continues downward.

Continue this behavior throughout the entire timeline.

---

NODE STATES

ACTIVE NODE

* Bright burgundy glow
* Soft outer glow
* Slight pulse animation
* Highest visual emphasis

COMPLETED NODE

* Solid burgundy fill
* No pulse
* Subtle glow

UPCOMING NODE

* Thin border only
* Reduced opacity
* No glow

---

TIMELINE LINE STATES

COMPLETED SECTION

* Burgundy gradient line
* Fully visible

ACTIVE SECTION

* Animated progression effect
* Smooth growth toward next milestone

UPCOMING SECTION

* Muted dark line
* Low opacity

---

SCROLL INTERACTION

Use scroll position or intersection observer.

As each journey card enters the viewport:

* Activate corresponding node.
* Update timeline progress.
* Move glow to current milestone.
* Animate progress smoothly.

The user should feel like they are travelling through a story rather than reading static cards.

---

VISUAL STYLE

Theme:

* Dark luxury aesthetic
* Burgundy accent color
* Subtle glassmorphism
* Premium portfolio quality

Effects:

* Soft glow only
* No excessive animations
* Smooth transitions
* Elegant motion

---

GOAL

Create a timeline where:

✔ The vertical line progressively fills as the user scrolls.

✔ Only the current milestone glows.

✔ Previous milestones remain completed.

✔ Future milestones remain inactive.

✔ The entire experience feels like progressing through a professional journey rather than viewing a static education timeline.

Think of it as a "career progression tracker" where the user's journey is revealed milestone by milestone as they move down the page.
