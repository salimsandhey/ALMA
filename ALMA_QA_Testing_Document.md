# ALMA App — QA Testing Document
**Version:** 1.0  
**Platform:** Mobile App (Android APK)  
**Testing Type:** UI / Manual  
**Prepared for:** QA Testing Team  

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Student | test@alma.com | Admin@123 |
| Admin | admin@alma.com | Admin@123 |

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not Tested |
| ✅ | Pass |
| ❌ | Fail |
| ⚠️ | Partial / Bug |

---

## Table of Contents

1. [Authentication & Onboarding](#1-authentication--onboarding)
2. [Home Screen](#2-home-screen)
3. [Modules & Lessons](#3-modules--lessons)
4. [Game Types](#4-game-types)
5. [Daily Challenge](#5-daily-challenge)
6. [Music & Karaoke](#6-music--karaoke)
7. [Entertainment](#7-entertainment)
8. [Explore](#8-explore)
9. [Leaderboard](#9-leaderboard)
10. [Profile](#10-profile)
11. [Badges](#11-badges)
12. [AI Coach](#12-ai-coach)
13. [Feedback](#13-feedback)
14. [Terms & Privacy](#14-terms--privacy)
15. [Admin — Overview](#15-admin--overview)
16. [Admin — Students](#16-admin--students)
17. [Admin — Modules & Lessons](#17-admin--modules--lessons)
18. [Admin — Songs](#18-admin--songs)
19. [Admin — Daily Challenges](#19-admin--daily-challenges)
20. [Admin — Entertainment Content](#20-admin--entertainment-content)
21. [Admin — Explore Content](#21-admin--explore-content)
22. [Admin — Feedback](#22-admin--feedback)
23. [Admin — AI Usage](#23-admin--ai-usage)
24. [Admin — Legal](#24-admin--legal)
25. [Edge Cases & Limits](#25-edge-cases--limits)

---

## 1. Authentication & Onboarding

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| AUTH-01 | App Launch | App installed, no session | Open the app | Splash screen shows ALMA logo, then redirects to login/register screen | ⬜ |
| AUTH-02 | Register — Valid | No existing account | 1. Tap Register 2. Enter a new email 3. Enter password (min 8 chars) 4. Tap Register | OTP screen appears, verification email sent | ⬜ |
| AUTH-03 | Register — Duplicate Email | Account already exists | 1. Tap Register 2. Enter already-registered email 3. Tap Register | Error message: "Email already in use" or similar | ⬜ |
| AUTH-04 | Register — Invalid Email | None | 1. Tap Register 2. Enter "notanemail" 3. Tap Register | Validation error shown, form not submitted | ⬜ |
| AUTH-05 | Register — Weak Password | None | 1. Tap Register 2. Enter valid email 3. Enter password with fewer than 8 chars 4. Tap Register | Validation error about password strength | ⬜ |
| AUTH-06 | OTP Verification — Valid | Registered, OTP email received | 1. Enter the 6-digit OTP from email 2. Tap Verify | Proceeds to onboarding Name screen | ⬜ |
| AUTH-07 | OTP Verification — Wrong Code | On OTP screen | 1. Enter incorrect OTP (e.g. 000000) 2. Tap Verify | Error: "Invalid or expired code" | ⬜ |
| AUTH-08 | OTP — Resend | On OTP screen | 1. Tap Resend OTP | New OTP sent, confirmation shown; resend button disabled briefly (60s cooldown) | ⬜ |
| AUTH-09 | Login — Valid Credentials | Account verified | 1. Tap Login 2. Enter registered email and password 3. Tap Login | Redirects to Home screen (or onboarding if incomplete) | ⬜ |
| AUTH-10 | Login — Wrong Password | None | 1. Tap Login 2. Enter valid email + wrong password 3. Tap Login | Error: "Invalid credentials" | ⬜ |
| AUTH-11 | Login — Unverified Email | Registered but OTP not verified | 1. Tap Login 2. Enter unverified credentials | Error or redirect to OTP screen | ⬜ |
| AUTH-12 | Forgot Password | On Login screen | 1. Tap Forgot Password 2. Enter registered email 3. Tap Send | OTP email sent, redirected to OTP reset screen | ⬜ |
| AUTH-13 | Reset Password — Valid OTP | Received reset OTP | 1. Enter correct OTP 2. Enter new password 3. Tap Confirm | Password updated, redirected to Login screen | ⬜ |
| AUTH-14 | Reset Password — Wrong OTP | On reset OTP screen | 1. Enter incorrect OTP | Error: "Invalid or expired code" | ⬜ |
| AUTH-15 | Google Sign-In | On login screen | 1. Tap Continue with Google 2. Select a Google account | App logs in or creates account, redirects to home/onboarding | ⬜ |
| AUTH-16 | Onboarding — Name | First login, onboarding starts | 1. Enter display name 2. Tap Next | Proceeds to next onboarding screen | ⬜ |
| AUTH-17 | Onboarding — Demographics | On demographics screen | 1. Select age range 2. Select gender 3. Tap Next | Proceeds to language screen | ⬜ |
| AUTH-18 | Onboarding — Language | On language screen | 1. Select native language from list 2. Tap Next | Proceeds to country screen | ⬜ |
| AUTH-19 | Onboarding — Country | On country screen | 1. Search for a country 2. Select it 3. Tap Next | Proceeds to completion screen | ⬜ |
| AUTH-20 | Onboarding — Complete | On completion screen | 1. Tap Get Started or equivalent | Redirects to Home screen; onboarding does not appear again on next login | ⬜ |
| AUTH-21 | Logout | Logged in as student | 1. Go to Profile 2. Tap Logout | Session cleared, redirected to Login screen | ⬜ |

---

## 2. Home Screen

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| HOME-01 | Home Screen Loads | Logged in as student | Open app / tap Home in nav bar | Home screen displays without errors | ⬜ |
| HOME-02 | XP Display | Student has completed at least one lesson | View Home screen | Total XP count shown correctly | ⬜ |
| HOME-03 | Streak Display | Student has logged in on consecutive days | View Home screen | Streak count shown (e.g. "3 day streak") | ⬜ |
| HOME-04 | Continue Lesson Card | Student has started but not completed a lesson | View Home screen | "Continue" card appears pointing to the correct in-progress lesson | ⬜ |
| HOME-05 | Continue Lesson Card — New User | Brand new account, no lessons started | View Home screen | "Start your first lesson" or similar prompt shown instead | ⬜ |
| HOME-06 | Leaderboard Preview | At least 1 other user exists | View Home screen | Top 5 leaderboard entries shown with names and XP | ⬜ |
| HOME-07 | Daily Greeting — AI Chat | Logged in, first open of the day | Open app / tap home | AI greeting message appears (chat bubble or modal) | ⬜ |
| HOME-08 | Daily Greeting — Already Seen | Greeting already shown today | Close and reopen app | Greeting does NOT re-appear for the rest of the day | ⬜ |
| HOME-09 | Bottom Navigation | On Home screen | Tap each tab (Home, Modules, Explore, Leaderboard, Profile) | Each tab navigates to correct screen without crash | ⬜ |

---

## 3. Modules & Lessons

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| MOD-01 | Modules List Loads | Logged in as student | Tap Modules tab | All 14 modules listed with title, description, and progress % | ⬜ |
| MOD-02 | Module Progress % | Student completed some lessons | View Modules list | Each module shows correct completion percentage | ⬜ |
| MOD-03 | Open Module | On Modules screen | Tap any module | Module detail screen opens showing all lessons inside | ⬜ |
| MOD-04 | Lesson List in Module | Module detail open | View lesson list | All lessons listed with lock/unlock and completion status | ⬜ |
| MOD-05 | Lesson Unlock Order | Student hasn't completed Lesson 1 | View module detail | Lesson 2 and beyond are locked; only Lesson 1 is accessible | ⬜ |
| MOD-06 | Open a Lesson | Lesson is unlocked | Tap a lesson | Lesson opens and shows first game card | ⬜ |
| MOD-07 | Lesson Completion — XP Award | Complete all cards in a lesson | Finish last card | Lesson Complete screen appears; XP shown (20 XP base) | ⬜ |
| MOD-08 | Lesson Completion — Progress Update | Complete a lesson | Return to module detail | Lesson marked complete; module % updated | ⬜ |
| MOD-09 | Module Completion Bonus | Complete last lesson in a module | Finish lesson | Additional module completion XP bonus shown | ⬜ |
| MOD-10 | Next Lesson Navigation | On Lesson Complete screen | Tap "Next Lesson" | Opens next lesson in sequence | ⬜ |
| MOD-11 | Return to Module | On Lesson Complete screen | Tap "Back to Module" | Returns to module detail screen | ⬜ |

---

## 4. Game Types

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| GAME-01 | Flashcard — View Card | Open a Flashcard lesson | View first card | Card shows word/image and translation | ⬜ |
| GAME-02 | Flashcard — Flip Card | On flashcard | Tap or swipe the card | Card flips to show reverse side | ⬜ |
| GAME-03 | Flashcard — Answer | On flashcard | Tap the correct answer option | Answer confirmed, next card shown | ⬜ |
| GAME-04 | Flashcard — Wrong Answer | On flashcard | Tap a wrong answer | Error feedback shown, correct answer revealed | ⬜ |
| GAME-05 | Flashcard — Progress | Playing through flashcard lesson | Complete multiple cards | Progress bar/counter advances after each card | ⬜ |
| GAME-06 | Word Match — Display | Open a Word Match lesson | View first card | Emoji shown with multiple word options to pick from | ⬜ |
| GAME-07 | Word Match — Correct | On Word Match card | Tap the correct word | Correct feedback, advance to next card | ⬜ |
| GAME-08 | Word Match — Wrong | On Word Match card | Tap an incorrect word | Wrong feedback shown, correct answer highlighted | ⬜ |
| GAME-09 | Fill Blank — Display | Open a Fill Blank lesson | View first card | Sentence with blank shown, word options visible | ⬜ |
| GAME-10 | Fill Blank — Correct | On Fill Blank card | Tap correct word to fill blank | Sentence completes, correct feedback | ⬜ |
| GAME-11 | Fill Blank — Wrong | On Fill Blank card | Tap wrong word | Error feedback, correct word revealed | ⬜ |
| GAME-12 | True/False — Display | Open a True/False lesson | View first card | Statement shown with True and False buttons | ⬜ |
| GAME-13 | True/False — Correct | On True/False card | Tap correct option (True or False) | Correct feedback + explanation shown | ⬜ |
| GAME-14 | True/False — Wrong | On True/False card | Tap wrong option | Error feedback + correct explanation shown | ⬜ |
| GAME-15 | Dialogue — Display | Open a Dialogue lesson | View first card | Conversation turns shown; GUEST message visible first | ⬜ |
| GAME-16 | Dialogue — Record Answer | On a USER turn | Tap microphone and speak a response | Recording captured, AI evaluates response | ⬜ |
| GAME-17 | Dialogue — Correct Answer | Speak an appropriate response | Finish speaking | Positive feedback, move to next turn | ⬜ |
| GAME-18 | Dialogue — Hint | On Dialogue turn | Tap Hint button (if available) | Sample answer or hint shown | ⬜ |
| GAME-19 | ImageSpeak — Display | Open an ImageSpeak lesson | View first card | Image shown with recording prompt | ⬜ |
| GAME-20 | ImageSpeak — Record | On ImageSpeak card | Tap mic and describe the image | Recording captured, answer compared | ⬜ |
| GAME-21 | ImageSpeak — Best Answer Shown | After recording | View result | DiffView shows best-matched answer vs spoken answer | ⬜ |
| GAME-22 | TTS Button | On any lesson card with text | Tap the speaker/TTS button | Text is read aloud in English | ⬜ |
| GAME-23 | Lesson — Card State Reset | Exit a lesson mid-way and re-enter | Re-open the same lesson | Cards start from beginning, no stale state carried over | ⬜ |

---

## 5. Daily Challenge

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| CHAL-01 | Daily Challenge Loads | Logged in | Tap Daily Challenge from Home or nav | Challenge question shown with mic button | ⬜ |
| CHAL-02 | Record Answer | On challenge screen | Tap mic, speak an answer | Recording captured and processed | ⬜ |
| CHAL-03 | Correct Answer — XP Award | Speak answer containing correct keywords | Submit answer | "Correct" or positive feedback shown, 10 XP awarded | ⬜ |
| CHAL-04 | Incorrect Answer | Speak answer with no matching keywords | Submit answer | Feedback shows correct sample answer, no XP awarded | ⬜ |
| CHAL-05 | One Attempt Per Day | Already submitted today's challenge | Navigate to Daily Challenge again | Challenge shows as already completed; cannot re-submit | ⬜ |
| CHAL-06 | New Challenge Next Day | Yesterday's challenge completed | Open app next day | New challenge question shown | ⬜ |

---

## 6. Music & Karaoke

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| MUS-01 | Songs List Loads | Logged in | Navigate to Music section | All songs listed with title, artist, emoji, genre | ⬜ |
| MUS-02 | Open Song Detail | On Songs list | Tap any song | Song detail screen opens with lyrics and YouTube player | ⬜ |
| MUS-03 | YouTube Player Loads | On Song detail | View YouTube embed | YouTube video loads and can be played | ⬜ |
| MUS-04 | Lyrics Display | On Song detail | View lyrics section | All lyrics lines shown in correct order | ⬜ |
| MUS-05 | Start Karaoke | On Song detail | Tap Start Karaoke or equivalent | Karaoke screen opens | ⬜ |
| MUS-06 | Karaoke Recording | On Karaoke screen | Tap mic and sing/speak lyrics | Recording captured per line | ⬜ |
| MUS-07 | Karaoke Results Screen | Complete karaoke session | Finish all lyrics | Results screen shown with score/feedback | ⬜ |
| MUS-08 | Karaoke — XP Award | Complete karaoke | View results | 10 XP awarded, shown on results screen | ⬜ |

---

## 7. Entertainment

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| ENT-01 | Entertainment List Loads | Logged in | Navigate to Entertainment section | List of videos and articles shown | ⬜ |
| ENT-02 | Video Content Opens | On Entertainment list | Tap a Video item | Content screen opens with YouTube embed + description | ⬜ |
| ENT-03 | Article Content Opens | On Entertainment list | Tap an Article item | Content screen opens with article link + description | ⬜ |
| ENT-04 | Quiz Questions Shown | Open any entertainment content | Scroll to quiz section | 2 quiz questions shown with text input or mic option | ⬜ |
| ENT-05 | Submit Quiz — Correct | Answer quiz question with correct keywords | Submit answer | Positive feedback shown | ⬜ |
| ENT-06 | Submit Quiz — Incorrect | Answer with unrelated words | Submit answer | Feedback shown with expected answer | ⬜ |
| ENT-07 | XP Award on Completion | Complete all quiz questions | Finish quiz | XP awarded (% of 30 XP based on score) | ⬜ |
| ENT-08 | One Attempt Per Content | Already completed this content | Navigate back to same content | Marked as completed; cannot re-submit quiz | ⬜ |

---

## 8. Explore

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| EXP-01 | Explore Screen Loads | Logged in | Tap Explore tab | Educational snippets shown | ⬜ |
| EXP-02 | Category Filter | On Explore screen | Tap different category tabs (Phrase of Day, Grammar Tip, Culture Note, Hospitality Fact) | List filters to selected category | ⬜ |
| EXP-03 | View Snippet | On Explore screen | Tap any snippet | Full content shown | ⬜ |
| EXP-04 | First View XP | Never viewed this snippet before | Open a snippet for the first time | 15 XP awarded | ⬜ |
| EXP-05 | No Duplicate XP | Already viewed a snippet | Open the same snippet again | No additional XP awarded | ⬜ |

---

## 9. Leaderboard

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| LB-01 | Leaderboard Loads | Logged in, other users exist | Tap Leaderboard tab | List of users ranked by XP shown | ⬜ |
| LB-02 | Own Rank Visible | Logged in | View leaderboard | Current user's name and rank highlighted | ⬜ |
| LB-03 | Rank Order | Multiple users with XP | View leaderboard | Users sorted from highest to lowest XP | ⬜ |
| LB-04 | XP Update Reflection | Complete a lesson earning XP | Return to leaderboard | XP total and rank updated to reflect new score | ⬜ |

---

## 10. Profile

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| PROF-01 | Profile Screen Loads | Logged in | Tap Profile tab | Profile screen shows name, avatar, XP, streak, country, language | ⬜ |
| PROF-02 | Avatar — Default | No avatar uploaded | View profile | Initial/letter avatar shown (first letter of name) | ⬜ |
| PROF-03 | Edit Profile — Open | On Profile screen | Tap Edit Profile | Edit profile form opens with current values pre-filled | ⬜ |
| PROF-04 | Edit Display Name | On Edit Profile | Change name, tap Save | Name updated and shown on profile screen | ⬜ |
| PROF-05 | Edit Age/Gender | On Edit Profile | Change age and gender, tap Save | Updated values saved and reflected on profile | ⬜ |
| PROF-06 | Edit Language | On Edit Profile | Change native language, tap Save | Language updated on profile | ⬜ |
| PROF-07 | Edit Country | On Edit Profile | Change country, tap Save | Country updated on profile | ⬜ |
| PROF-08 | Upload Avatar — Photo Library | On Edit Profile | Tap avatar, choose from gallery, select image, save | Profile photo updated to selected image | ⬜ |
| PROF-09 | Avatar — Photo Shown Everywhere | Avatar uploaded | Check Home, Leaderboard, Profile | Photo avatar shown in all places that previously showed initial circle | ⬜ |
| PROF-10 | How to Use | On Profile screen | Tap How to Use | Tutorial/help screen opens | ⬜ |

---

## 11. Badges

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| BADGE-01 | Badges Screen Loads | Logged in | Navigate to Badges (from Profile) | All 12 badges shown | ⬜ |
| BADGE-02 | Locked Badge Display | Badge not earned | View unearned badge | Badge shown as locked/greyed out | ⬜ |
| BADGE-03 | Earned Badge Display | Badge has been earned | View earned badge | Badge shown with full color and earned date | ⬜ |
| BADGE-04 | First Steps Badge | Complete first lesson | Check badges | "First Steps" badge awarded | ⬜ |
| BADGE-05 | Quiz Master Badge | Score 100% on any quiz | Check badges | "Quiz Master" badge awarded | ⬜ |
| BADGE-06 | On Fire Badge | Maintain a 3-day streak | Check badges | "On Fire!" badge awarded | ⬜ |
| BADGE-07 | Week Warrior Badge | Maintain a 7-day streak | Check badges | "Week Warrior" badge awarded | ⬜ |
| BADGE-08 | World Explorer Badge | Complete first entertainment quiz | Check badges | "World Explorer" badge awarded | ⬜ |
| BADGE-09 | Hospitality Hero Badge | Complete Hotel & Hospitality module | Check badges | "Hospitality Hero" badge awarded | ⬜ |
| BADGE-10 | Word Wizard Badge | Complete 10 lessons | Check badges | "Word Wizard" badge awarded | ⬜ |

---

## 12. AI Coach

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| COACH-01 | Coach Screen Opens | Logged in | Navigate to AI Coach | Coach screen loads, session status shown | ⬜ |
| COACH-02 | Start New Session | No session today | Tap Start New Session | New chat session begins, AI sends first message | ⬜ |
| COACH-03 | Send Message | Session active | Type a message, tap Send | Message sent, AI responds | ⬜ |
| COACH-04 | AI Response Quality | Session active | Ask a hospitality-related question | AI responds with relevant, helpful English content | ⬜ |
| COACH-05 | XP per Message | Session active | Send a message | +5 XP awarded per message (check XP on profile) | ⬜ |
| COACH-06 | Daily Session Limit | Already used coach today | Tap Start New Session | Message shown: session limit reached for today | ⬜ |
| COACH-07 | Message Limit | Session active, near 50 messages | Send messages up to limit | After 50 messages, further sending blocked with message | ⬜ |
| COACH-08 | Grammar Check | In lesson or coach context | Submit text for grammar check | AI returns grammar feedback with corrections highlighted | ⬜ |

---

## 13. Feedback

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| FB-01 | Feedback Screen Opens | Logged in | Navigate to Feedback (from Profile) | Feedback form shown with star rating and comment field | ⬜ |
| FB-02 | Submit Feedback — Valid | On Feedback screen | 1. Select star rating (1–5) 2. Select topic 3. Write comment 4. Submit | Feedback submitted, confirmation shown | ⬜ |
| FB-03 | Submit Without Rating | On Feedback screen | Tap Submit without selecting stars | Validation error: rating required | ⬜ |
| FB-04 | View Past Feedback | Already submitted feedback | Open Feedback screen | Previous submissions shown with status and any admin reply | ⬜ |
| FB-05 | Admin Reply Visible | Admin has replied to feedback | Open Feedback screen | Admin reply shown below the original submission | ⬜ |
| FB-06 | Rate Limit | Already submitted feedback this week | Try to submit again within 7 days | Error: can only submit once per 7 days | ⬜ |

---

## 14. Terms & Privacy

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| LEGAL-01 | Terms & Privacy Opens | Logged in | Navigate to Terms & Privacy (from Profile) | Screen opens with Terms of Use and Privacy Policy content | ⬜ |
| LEGAL-02 | Content Readable | On Terms & Privacy screen | Scroll through content | All sections render correctly, text is readable | ⬜ |
| LEGAL-03 | Content Updated by Admin | Admin has edited legal content | View Terms & Privacy | Shows the latest admin-updated content | ⬜ |

---

## 15. Admin — Overview

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| ADM-OV-01 | Admin Login | Admin credentials | 1. Open app 2. Login with admin@alma.com / Admin@123 | Redirected to Admin panel (not student home) | ⬜ |
| ADM-OV-02 | Overview Dashboard Loads | Logged in as admin | Navigate to Overview | Dashboard shows: total students, active today, active this week, avg completion % | ⬜ |
| ADM-OV-03 | Module Popularity Stats | Students have completed modules | View Overview | Module list shown with completion/attempt counts | ⬜ |
| ADM-OV-04 | Needs Help List | Some students have low progress | View Overview | Students with low engagement or stuck shown in needs-help list | ⬜ |
| ADM-OV-05 | Needs Help — Student Profile | On Overview | Tap a student in needs-help list | Student's profile picture and detail visible | ⬜ |
| ADM-OV-06 | Export CSV Report | On Overview | Tap Download / Export Report | CSV file downloaded with: name, email, country, language, XP, streak, completion %, badges | ⬜ |

---

## 16. Admin — Students

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| ADM-STU-01 | Students List Loads | Logged in as admin | Navigate to Students | List of all students shown with name, email, status | ⬜ |
| ADM-STU-02 | Search Student | On Students screen | Type a student name in search bar | Matching students shown in real-time | ⬜ |
| ADM-STU-03 | Filter — Active | On Students screen | Select Active filter | Only active students shown | ⬜ |
| ADM-STU-04 | Filter — Inactive | On Students screen | Select Inactive filter | Only deactivated students shown | ⬜ |
| ADM-STU-05 | Student Profile Avatar | Student has uploaded an avatar | View students list | Student's actual photo shown instead of initial circle | ⬜ |
| ADM-STU-06 | Open Student Detail | On Students list | Tap any student | Detail screen shows: XP, streak, completion %, badges earned, module-by-module progress | ⬜ |
| ADM-STU-07 | Deactivate Student | On Student detail | Tap Deactivate / Change Status | Student status set to inactive; student can no longer login | ⬜ |
| ADM-STU-08 | Reactivate Student | Student is deactivated | Tap Activate on inactive student | Student status restored to active | ⬜ |
| ADM-STU-09 | Export Individual Report | On Student detail screen | Tap Download Report | CSV downloaded with that student's individual stats | ⬜ |

---

## 17. Admin — Modules & Lessons

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| ADM-MOD-01 | Modules List Loads | Logged in as admin | Navigate to Modules | All modules listed with title, status, completion stats | ⬜ |
| ADM-MOD-02 | Create Module | On Modules screen | 1. Tap Add/Create 2. Enter title and description 3. Tap Save | New module appears in list | ⬜ |
| ADM-MOD-03 | Upload Module Image | Creating or editing a module | 1. Tap image area 2. Select image from device | Image uploaded and shown as module thumbnail | ⬜ |
| ADM-MOD-04 | Edit Module | On Modules list | 1. Tap Edit on a module 2. Change title 3. Save | Updated title shown in list | ⬜ |
| ADM-MOD-05 | Publish/Unpublish Module | On module edit | Toggle publish status | Students can/cannot see module based on published status | ⬜ |
| ADM-MOD-06 | Delete Module | On Modules list | Tap Delete on a module, confirm | Module removed from list | ⬜ |
| ADM-MOD-07 | View Module Lessons | On Modules list | Tap a module to expand/open | All lessons inside that module shown | ⬜ |
| ADM-MOD-08 | Create Lesson — Flashcard | Inside a module | 1. Tap Add Lesson 2. Choose Flashcard type 3. Add cards with word/image/targetWord 4. Save | Lesson created and visible in module | ⬜ |
| ADM-MOD-09 | Create Lesson — Word Match | Inside a module | 1. Add Lesson 2. Choose Word Match 3. Add cards with emoji + correct word + distractors 4. Save | Lesson created correctly | ⬜ |
| ADM-MOD-10 | Create Lesson — Fill Blank | Inside a module | 1. Add Lesson 2. Choose Fill Blank 3. Add sentence template + correct answer + distractors 4. Save | Lesson created correctly | ⬜ |
| ADM-MOD-11 | Create Lesson — True/False | Inside a module | 1. Add Lesson 2. Choose True/False 3. Add statements with true/false + explanation 4. Save | Lesson created correctly | ⬜ |
| ADM-MOD-12 | Create Lesson — Dialogue | Inside a module | 1. Add Lesson 2. Choose Dialogue 3. Add conversation turns 4. Save | Lesson created correctly | ⬜ |
| ADM-MOD-13 | Edit Lesson | In module, lesson exists | Tap Edit on a lesson, change title, save | Updated lesson shown | ⬜ |
| ADM-MOD-14 | Delete Lesson | Lesson exists in module | Tap Delete on a lesson, confirm | Lesson removed from module | ⬜ |

---

## 18. Admin — Songs

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| ADM-SONG-01 | Songs List Loads | Logged in as admin | Navigate to Songs | All karaoke songs listed | ⬜ |
| ADM-SONG-02 | Create Song | On Songs screen | 1. Tap Add 2. Enter title, artist, genre, emoji 3. Enter YouTube URL (youtube.com or youtu.be) 4. Enter lyrics (one per line) 5. Save | Song appears in list | ⬜ |
| ADM-SONG-03 | Create Song — Invalid URL | Creating a song | Enter a non-YouTube URL (e.g. vimeo.com) | Validation error: YouTube URLs only | ⬜ |
| ADM-SONG-04 | Edit Song | Song exists | Tap Edit, change artist name, save | Updated artist shown in list | ⬜ |
| ADM-SONG-05 | Delete Song | Song exists | Tap Delete, confirm | Song removed from list | ⬜ |
| ADM-SONG-06 | Song Visible to Students | Song created | Login as student, go to Music | New song appears in student song list | ⬜ |

---

## 19. Admin — Daily Challenges

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| ADM-CHAL-01 | Challenges List Loads | Logged in as admin | Navigate to Challenges | All daily challenges listed with question and attempt counts | ⬜ |
| ADM-CHAL-02 | Create Challenge | On Challenges screen | 1. Tap Add 2. Enter question 3. Enter sample answer 4. Enter keywords (comma separated) 5. Set XP reward 6. Save | Challenge appears in list | ⬜ |
| ADM-CHAL-03 | Edit Challenge | Challenge exists | Tap Edit, change question text, save | Updated question shown | ⬜ |
| ADM-CHAL-04 | Delete Challenge | Challenge exists | Tap Delete, confirm | Challenge removed | ⬜ |
| ADM-CHAL-05 | Challenge Visible to Students | Challenge created | Login as student, open Daily Challenge | New challenge appears in rotation | ⬜ |
| ADM-CHAL-06 | Delete Non-Existent Challenge | None | Attempt to delete an already-deleted challenge | Graceful error or 404 — no crash | ⬜ |

---

## 20. Admin — Entertainment Content

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| ADM-ENT-01 | Entertainment List Loads | Logged in as admin | Navigate to Entertainment | All videos and articles listed | ⬜ |
| ADM-ENT-02 | Create Video Content | On Entertainment screen | 1. Tap Add 2. Select type: Video 3. Enter title, description, YouTube URL, duration 4. Set XP reward 5. Add 2 quiz questions with expected answers and keywords 6. Save | Content appears in list | ⬜ |
| ADM-ENT-03 | Create Article Content | On Entertainment screen | 1. Tap Add 2. Select type: Article 3. Enter title, description, article URL 4. Add quiz questions 5. Save | Article content appears | ⬜ |
| ADM-ENT-04 | Edit Content | Content exists | Tap Edit, change description, save | Updated description shown | ⬜ |
| ADM-ENT-05 | Delete Content | Content exists | Tap Delete, confirm | Content removed from list | ⬜ |
| ADM-ENT-06 | Content Visible to Students | Content created | Login as student, go to Entertainment | New content appears | ⬜ |

---

## 21. Admin — Explore Content

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| ADM-EXP-01 | Explore Content List Loads | Logged in as admin | Navigate to Explore Content | All educational snippets listed with category | ⬜ |
| ADM-EXP-02 | Create Snippet — Phrase of Day | On Explore Content | 1. Tap Add 2. Enter title and body 3. Select category: Phrase of Day 4. Save | Snippet appears in list | ⬜ |
| ADM-EXP-03 | Create Snippet — Grammar Tip | On Explore Content | 1. Tap Add 2. Enter title and body 3. Select category: Grammar Tip 4. Save | Snippet appears under Grammar Tip | ⬜ |
| ADM-EXP-04 | Edit Snippet | Snippet exists | Tap Edit, change body text, save | Updated body shown | ⬜ |
| ADM-EXP-05 | Delete Snippet | Snippet exists | Tap Delete, confirm | Snippet removed | ⬜ |
| ADM-EXP-06 | Snippet Visible to Students | Snippet created | Login as student, open Explore | New snippet shown under correct category | ⬜ |

---

## 22. Admin — Feedback

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| ADM-FB-01 | Feedback List Loads | Logged in as admin, student submitted feedback | Navigate to Feedback | All student feedback shown with star rating, topic, comment | ⬜ |
| ADM-FB-02 | Unanswered Count | Some feedback has no reply | View Feedback screen | Unanswered feedback count shown (badge or counter) | ⬜ |
| ADM-FB-03 | Reply to Feedback | Feedback exists with no reply | 1. Tap feedback item 2. Type a reply 3. Tap Send | Reply saved and shown under feedback | ⬜ |
| ADM-FB-04 | Edit Reply | Reply already exists | 1. Tap feedback with reply 2. Edit reply text 3. Save | Updated reply shown | ⬜ |
| ADM-FB-05 | Student Sees Reply | Admin has replied | Login as student, open Feedback screen | Admin reply visible below original submission | ⬜ |

---

## 23. Admin — AI Usage

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| ADM-AI-01 | AI Usage Screen Loads | Logged in as admin | Navigate to AI Usage | Screen loads without error | ⬜ |
| ADM-AI-02 | Total Cost Display | Some AI features used by students | View AI Usage | Total estimated cost shown in USD | ⬜ |
| ADM-AI-03 | Breakdown by Feature | AI used across multiple features | View AI Usage | Cost breakdown shown per feature (Daily Greeting, Coach, Grammar Check, etc.) | ⬜ |
| ADM-AI-04 | Top Users | Students have used AI features | View AI Usage | Top users ranked by token usage shown | ⬜ |
| ADM-AI-05 | Filter by Period | On AI Usage screen | Toggle between 7 days, 30 days, All Time | Data updates to match selected period | ⬜ |

---

## 24. Admin — Legal

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| ADM-LEG-01 | Legal Editor Opens | Logged in as admin | Navigate to Legal | Terms of Use and Privacy Policy sections shown in editable form | ⬜ |
| ADM-LEG-02 | Edit Terms of Use | On Legal screen | 1. Modify text in Terms section 2. Tap Save | Confirmation shown, changes saved | ⬜ |
| ADM-LEG-03 | Edit Privacy Policy | On Legal screen | 1. Modify Privacy Policy text 2. Tap Save | Changes saved | ⬜ |
| ADM-LEG-04 | Incomplete Section — Save Blocked | On Legal screen | Delete content from one section and try to save | Save blocked, validation error shown for the incomplete section | ⬜ |
| ADM-LEG-05 | Student Sees Updated Content | Admin updated legal content | Login as student, go to Terms & Privacy | Student sees the new admin-updated content | ⬜ |

---

## 25. Edge Cases & Limits

| Test ID | Test Case | Pre-condition | Steps | Expected Result | Status |
|---------|-----------|---------------|-------|-----------------|--------|
| EDGE-01 | Daily Greeting — 20 Call Limit | Student has triggered AI greeting 20 times today | Try to trigger greeting again | Greeting silently skipped or rate limit message shown | ⬜ |
| EDGE-02 | Coach Message — 50/day Limit | Student sent 50 messages today | Try to send another message | Message blocked, "daily limit reached" shown | ⬜ |
| EDGE-03 | Grammar Check — 100/day Limit | Grammar check used 100 times | Attempt grammar check | Request blocked, limit message shown | ⬜ |
| EDGE-04 | Feedback — 7-Day Rate Limit | Submitted feedback in the last 7 days | Try to submit again | Error: "You can only submit feedback once every 7 days" | ⬜ |
| EDGE-05 | No Modules State | All modules unpublished by admin | Login as student, open Modules | Empty state shown — no crash, friendly message | ⬜ |
| EDGE-06 | No Songs State | All songs deleted by admin | Login as student, go to Music | Empty state shown gracefully | ⬜ |
| EDGE-07 | No Entertainment Content | All content deleted | Go to Entertainment | Empty state shown, no crash | ⬜ |
| EDGE-08 | Invalid Avatar Upload | On Edit Profile | Try to upload a non-image file (e.g. PDF) | Upload rejected, error message shown | ⬜ |
| EDGE-09 | Deactivated Account Login | Admin deactivated a student | Student tries to log in | Login rejected, error or message explaining account is inactive | ⬜ |
| EDGE-10 | Admin Cannot Access Student Home | Logged in as admin | Try to navigate to student home, modules, leaderboard | Admin is kept in admin panel only | ⬜ |
| EDGE-11 | Student Cannot Access Admin Panel | Logged in as student | Try to navigate to admin routes | Access denied, redirected to student home | ⬜ |
| EDGE-12 | Completion % Never Exceeds 100 | Student completes all lessons | Check module and overall completion % | Percentages capped at 100%, never shows 101% or higher | ⬜ |
| EDGE-13 | Long Text in Feedback | On Feedback form | Enter a very long comment (500+ characters) | Either accepted cleanly or trimmed with a counter — no crash | ⬜ |
| EDGE-14 | Back Navigation | On any nested screen | Tap back button | Returns to correct previous screen without data loss | ⬜ |
| EDGE-15 | App Resume After Background | Mid-lesson | Press Home button, wait 2 min, re-open app | App resumes without crash, lesson state preserved | ⬜ |

---

## Summary Tracker

| Section | Total Tests | Passed | Failed | Partial |
|---------|-------------|--------|--------|---------|
| Auth & Onboarding | 21 | | | |
| Home Screen | 9 | | | |
| Modules & Lessons | 11 | | | |
| Game Types | 23 | | | |
| Daily Challenge | 6 | | | |
| Music & Karaoke | 8 | | | |
| Entertainment | 8 | | | |
| Explore | 5 | | | |
| Leaderboard | 4 | | | |
| Profile | 10 | | | |
| Badges | 10 | | | |
| AI Coach | 8 | | | |
| Feedback | 6 | | | |
| Terms & Privacy | 3 | | | |
| Admin — Overview | 6 | | | |
| Admin — Students | 9 | | | |
| Admin — Modules & Lessons | 14 | | | |
| Admin — Songs | 6 | | | |
| Admin — Daily Challenges | 6 | | | |
| Admin — Entertainment | 6 | | | |
| Admin — Explore Content | 6 | | | |
| Admin — Feedback | 5 | | | |
| Admin — AI Usage | 5 | | | |
| Admin — Legal | 5 | | | |
| Edge Cases & Limits | 15 | | | |
| **TOTAL** | **215** | | | |

---

*Document prepared for ALMA QA Team — UI Manual Testing*
