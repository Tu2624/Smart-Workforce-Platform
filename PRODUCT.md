# Product

## Register

product

## Users

Three distinct user roles, each with specific workflows:

1. **Employers** (primary power user): Small-to-medium business managers hiring part-time student workers. They create jobs, schedule shifts, review attendance, approve payroll, and monitor workforce performance. Context: at a desk or laptop, managing operations during business hours. Need efficiency and control.

2. **Students** (high-frequency user): University students taking part-time shifts. They browse available work, register for shifts, check in/out, and track earnings. Context: on mobile or laptop between classes, quick actions under time pressure. Need speed and clarity.

3. **Admins** (low-frequency, high-authority): Platform operators managing all users, resolving disputes, viewing system-wide statistics. Context: internal tool usage, need density and data access.

## Product Purpose

Smart Workforce Platform automates the lifecycle of part-time student employment: posting jobs, scheduling shifts, tracking attendance with real-time check-in/out, computing payroll with deduction rules, and maintaining a reputation scoring system. Success means employers spend less time on HR admin, students get paid accurately and on time, and the platform becomes the default tool for student workforce management at Vietnamese universities.

## Brand Personality

Trustworthy, efficient, modern. The platform handles money (payroll) and reputation (scoring), so reliability and precision are paramount. The tone is professional but approachable, not corporate-stiff. Vietnamese-first UI copy.

## Anti-references

- Generic Bootstrap admin templates with flat white cards and no personality
- Overly playful or gamified UIs that undermine the seriousness of payroll and scheduling
- Dark "hacker" aesthetic with neon green text on black
- Cluttered dashboards that show everything at once without hierarchy
- Enterprise software that requires training to understand

## Design Principles

1. **Clarity over decoration**: Every visual element serves navigation, comprehension, or action. Nothing is decorative-only.
2. **Earned trust through precision**: Payroll numbers, attendance times, and reputation scores are displayed with exact formatting. No ambiguity.
3. **Progressive disclosure**: Show what matters now; let users drill deeper. Dashboards summarize; detail pages explain.
4. **Speed of use**: Students check in under time pressure. Employers review shifts between meetings. Every interaction should complete in minimal steps.
5. **Role-appropriate density**: Students get spacious mobile-friendly layouts. Employers get denser desktop layouts with tables and charts. Admins get maximum data density.

## Accessibility & Inclusion

- WCAG 2.1 AA minimum contrast ratios (4.5:1 for normal text, 3:1 for large text)
- All interactive elements keyboard-navigable
- Vietnamese language support with proper diacritical rendering
- Reduced motion support via `prefers-reduced-motion` media query
- Color-blind safe status indicators (never rely on color alone for status)
