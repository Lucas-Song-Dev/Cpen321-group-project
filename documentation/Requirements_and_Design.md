# Requirements and Design

## 1. Change History

| **Change Date** | **Modified Sections** | **Rationale** |
| --------------- | --------------------- | ------------- |
| September 26, 2025 | Initial Plan | First milestone submission (M2) |
| October 10, 2025 | Section 3.2, 3.7  | Fixed use case diagram according to feedback in M2 and non-function requirements section with concrete research to back up requirements |
| October 28, 2025 | Added section 4.4, 4.6, 4.7, Modified section 3.1, 4.1, 4.2, 4.3, 4.5 | Implemented M3 Requirements, fixed document according to app implementation and made further M2 feedback changes |
| November 9, 2025 | Section 3.4, 4.1 | Added missing endpoints (health check, transfer ownership, get profile, get tasks by date), corrected API endpoint paths and parameters, added transfer ownership use case |
| November 28, 2025 | Section 3.1, 3.2, 3.4| Added more specific feature descriptions based on TA feedback. Edited use case names to match with use case diagram |


---

## 2. Project Description

RoomSync is a comprehensive roommate management application designed to streamline the process of connecting with and living harmoniously with roommates. The app addresses common challenges in shared living situations by providing tools for communication, task management, and accountability through a rating system.

The application targets university students, young professionals, and anyone seeking or currently residing in a shared accommodation. RoomSync facilitates the entire roommate lifecycle– from viewing roommates track records to pick a 'good roommate', through creating a space to encourage communication and task coordination, to providing feedback and ranking that helps build trustworthy roommate profiles for future living arrangements.

---

## 3. Requirements Specification

### **3.1. List of Features**

**User Authentication** - For secure user sign up or login using Google OAuth 2.0. Users must have an existing google account. Users can also log out or delete their account. If they delete their account, the user can later create an account using the same google account but their previous data will not be restored.

**User Profile Management** - A user must fill out all mandatory fields (listed in section a), upon user profile creation. If these fields are not filled out, the user's account isn't offically created yet and the user doesn't have access to the rest of our app's features. After filling out all mandatory fields, users can choose to fill out optional fields (listed in section b). Editable fields can be changed anytime in the user management page whereas non-editable fields can't be changed after account creation. User profiles are essential as they can be shared to access compatibility for housing and roommate applications.

- **Mandatory/Not editable (kept private)**
  - Name (Legal first and last name)
  - DOB
  - Gender
  - Email (this will be automatically filled out after creating an account through Google user authentication)
- **Optional/editable**
  - Nickname
  - Bio
  - Profile picture
  - Living preference/expectations (ex. morning/night person, drinking, partying, noise, profession/student)

**Group Management** – Users can either create a new group or join an existing group.

- **Create Group**: Must enter group name (editable) and a unique group (not editable) code will be created. This group code can be shared.
- **Join Group**: Users can enter a unique group code to join a group.
- **Maximum 10 users in a group**: Additional users will be unable attempt to join group
- **View Group**: See group members profiles, name of group and each member's group join date.
- **Leave Group**: Any user part of a group can leave the group. When the owner leaves, ownership automatically transfers to the oldest member (by join date). If the owner is the only member, the group is deleted.
- **Delete Group** – Owner of group can delete group which gets rid of all group chats, tasks, and other group related features
- **Remove Group Member** – Group owner can remove group members who are no longer living together
- **Transfer Group Ownership** – Group owner can transfer ownership to another group member before they leave the group

**Group Communication** - Real-time messaging system with live updates for seemless group messaging that includes all group members. Messages can be sent by any member within a group and is visible to everyone within the group. An integrated polling functionality is implemented where users to ask questions that require group decisions with pre-determined answering options. The polls will expire one week after it is sent to the group.

**Group Task Management** - Algorithmic task assignment and tracking system for household responsibilities

- **View Tasks**: Three view options - Calendar View (tasks by selected date), Weekly View (all group tasks grouped by day), My Tasks (personal tasks grouped by day).
- **Set Task Status**: Default status is 'incomplete'. Users can update to 'in-progress' or 'completed'.
- **Add Task**: Enter task name, optional description, difficulty (1-5), recurrence (one-time/daily/weekly/bi-weekly/monthly), required people (1-10), deadline (for one-time tasks), and optional member assignment.
- **Delete Tasks** – Delete tasks if a task is no longer needed
- **Task Assignment**: After creating task, the task can be assigned via algorithm for fair distribution, or manually assigned at creation to specific members.

**Roommate Rating System** - Users can rate roommate experience after living with them for a minimum of 30 days.

- **Rating** - Users can give their roommates a score out of 5 based on their personal living experience. This feature is unlocked after the user lived with that roommate for atleast 30 days.
- **Write Testimonial** - Users can optionally leave comments and testimonies to describe their personal living experience.
- **View Roommate Ratings** – View other user's average ratings and testimonials from previous roommates 
- While bad roomates might be able to delete account or not have one, it is still a good way for good roommates to build up a track record of cleanliness for future rooms. This has been proven to work like Ebay or Facebook marketplace.

**User Moderation** - Automated content moderation using LLM

- Users can report inappropriate behavior. The system analyzes the reported user's recent messages (up to 50) using OpenAI to determine if content violates community standards (harassment, hate speech, threats, etc.).
- If deemed offensive, the user is flagged in the database (isOffensive field set to true) and is no longer allowed to acccess their account.

### **3.2. Use Case Diagram**

![Use Case Diagram](./images/UseCaseDiagram.jpg)

### **3.3. Actors Description**

**Human Actors:**

1. **Non-Group Member**: A registered user who is not currently part of any roommate group. Can create and edit their profile, create new groups, and join existing groups through invitation codes. Cannot access group-specific features like chat, task management, or rating systems since these require active group membership.

2. **Group Member**: A registered user who belongs to a roommate group but is not the group owner. Has access to all group features including group chat, polling, task management (viewing and completing assigned tasks), viewing other group members' profiles, and rating roommates (must have lived together for minimum 30 days). Can leave the group voluntarily but cannot remove other members or delete the group.

3. **Group Owner**: A group member with additional administrative privileges. Can perform all group member functions plus remove other group members from the group and delete the entire group. When leaving the group will transfer ownership to the oldest other group member. Also has rating privileges for roommates they have lived with for the required minimum period.

**External System Actors:**

4. **Google OAuth 2.0 API**: External authentication service that verifies user identity during account creation (use case 1) and login (use case 2). The system interacts with this API to validate Google ID tokens and retrieve user email and name information. This is a required external dependency for user authentication.

### **3.4. Use Case Description**

#### **Use cases for User Authentication**
1. **Sign Up** – Secure account creation using Google OAuth (interaction with Google OAuth 2.0 API)  
2. **Login** – Secure account login using Google OAuth (interaction with Google OAuth 2.0 API)
3. **Logout** – User logs out of the application, clearing locally stored authentication tokens
4. **Delete Account** – User logs out of the application, clearing locally stored authentication tokens  

#### **Use cases for User Profile Management**
5. **Update Optional Profile Fields: nickname, bio, living preferences and profile picture** – Users can choose a nickname, update their bio text, indicate living preferences by selecting pre-determined options regarding their schedule, drinking, partying, noise, and profession descriptions and users can add, change, or remove their profile picture

#### **Use cases for Group Management**
6. **Create Group** – Establish a new living group and generate a unique invitation code for prospective roommates
7. **Join Group** – Join an existing roommate group by entering a unique 4 digit alphanumeric invitation code
8. **View Group** – View members of the group, group name, and member join dates
9. **Leave Group** – Group members can leave a group they are a part of (owner leaving transfers to oldest member; if alone, deletes group)
10. **Delete Group** – Owner of group can delete group which gets rid of all group chats, tasks, and other group related features
11. **Remove Group Member** – Group owner can remove group members
12. **Transfer Group Ownership** – Group owner can transfer ownership to another group member

#### **Use cases for Group Communication**
13. **Send Messages** – Real-time messaging system for communication between all group members
14. **Send Polls** – A voting mechanism for group decisions regarding household policies and activities  

#### **Use cases for Group Task Management**
15.  **Add Tasks** – Create tasks with name, description, difficulty (1-5), recurrence, deadline (for one-time tasks), and optional member assignment. View tasks in Calendar, Weekly, or My Tasks views
16.  **Auto-Assign Tasks** – After creating task, user who created task can press button to automatically distribute tasks to other users based on task parameters previously inputed.
17.  **Delete Tasks** – Delete tasks if a task is no longer needed
18.  **Set Task Status** – Update task status to *in-progress* or *completed* for assigned tasks  

#### **Use cases for Roommate Rating System**
18. **Rate Roommate** – Rate roommate performance (1–5 stars) after living together for a minimum of 30 days
19. **Write Testimonial** – Add optional written feedback about roommate experience
20. **View Roommate Ratings** – View user profiles, average ratings, and testimonials from previous roommates  

#### **Use cases for User Moderation**
21. **Report User** – Report inappropriate user behavior for review  

### **3.5. Formal Use Case Specifications (5 Most Major Use Cases)**

<a name="uc1"></a>
#### Use Case 1: Create account

**Description**: Secure account creation process using Google OAuth. User profiles will also be created.

**Primary Actor**: Non-Group Member

**Main success scenario**:
1. A person with an existing google account clicks 'Sign Up'
2. Selects the google account they want to use to create account in pop-up
3. System checks if account with that google account can be created
4. User is shown Personal Profile screen. Name and email are pre-filled from Google (read-only). User must fill out date of birth and select gender (Male/Female/Prefer-not-to-say).
5. User clicks 'Continue'
6. User is shown Optional Profile screen. Can fill out bio, select living preferences (schedule, drinking, partying, noise, profession), and upload a profile picture.
7. User clicks 'Continue' or skips
8. User is navigated to home screen

**Failure scenario(s)**:
- 3a. A user who has an existing account tries to create an account
  - System displays an error message saying that an account associated with that google account already exists and suggests logging in instead
- 5a. User clicks Continue but date of birth or gender is not filled
  - Continue button is disabled until both fields are completed
- 5b. User enters invalid date of birth
  - System displays an error message during profile update
- 6a. User uploads profile picture file that is too large
  - System displays an error message saying that the file is too large
- 7a. Bio exceeds character limit
  - System displays an error message or truncates input

<a name="uc9"></a>
#### Use Case 9: Create Group

**Description**: Non-Group Member establishes a new roommate group and receives invitation code to share with potential roommates.

**Primary Actor**: Non-Group Member

**Main Success Scenario**:
1. User navigates to group creation page
2. User enters group name in text field
3. User clicks 'Create Group' button
4. System creates group with user as owner and generates unique 4-character alphanumeric invitation code
5. System displays success message "Group created successfully!"
6. System displays group code in a card with instructions to "Share this code with your roommates"
7. User is automatically navigated to group dashboard after a moment

**Failure Scenarios**:
- 2a. Group name is left empty
  - 'Create Group' button is disabled until group name is entered
- 3a. User already belongs to a group
  - System displays error that user must leave current group first to create a group
  - User is redirected to current group dashboard
- 3b. Network error during group creation
  - System displays error message
  - User can retry creating the group

<a name="uc14"></a>
<a name="uc15"></a>
#### Use Case 15: Create Poll

**Description**: Group members can create and send polls for household decisions in group chat.

**Primary Actor**: Group Member, Group Owner

**Main Success Scenario**:
1. User opens group chat interface
2. User clicks poll icon button to open "Create Poll" dialog
3. User enters poll question in text field
4. User enters options (minimum 2, maximum 10). Can add additional options with "Add Option" button
5. User selects poll type: Single Choice or Multiple Choice (default: Single Choice)
6. User selects duration: 1, 3, or 7 days (default: 7 days)
7. User clicks "Create Poll" button
8. System validates poll has question and at least 2 options, then creates and broadcasts poll to all group members
9. Other group members see poll in chat and can vote
10. System displays live results as votes come in
11. Poll closes automatically after selected duration or when all members have voted

**Failure Scenarios**:
- 7a. Poll created with empty question or less than 2 options
  - 'Create Poll' button may be disabled, or system displays validation error
- 7b. Poll question or options exceed character limits
  - System may truncate or display error message
- 8a. Network error when creating poll
  - System displays error message
  - User can retry creating the poll
- 9a. Real-time connection lost while voting
  - System attempts to reconnect automatically
  - User sees "reconnecting" status until connection restored

<a name="uc16"></a>
#### Use Case 16: Add Task

**Description**: A household task that will be equally distributed among all roommates is created. The system assigns tasks to group members using a fair allocation algorithm.

**Primary Actor**: Group Member, Group Owner

**Main Success Scenario**:
1. User clicks 'Create Task'
2. User enters task name and optional description
3. User selects difficulty (1-5 scale), recurrence (one-time, daily, weekly, bi-weekly, monthly), and required people (1-10)
4. If one-time task, user sets deadline date
5. User optionally selects specific group members to assign the task to
6. User clicks 'Create Task'
7. System creates task and assigns to selected members for current week, or queues for weekly algorithmic assignment if no members specified
8. Users can view tasks in three views: Calendar View (tasks by selected date), Weekly View (all group tasks grouped by day), or My Tasks (personal tasks grouped by day) 

**Extensions/Failure Scenarios**:
- 2a. Task name is empty
  - System displays error and disables 'Create Task' button until name is provided
- 4a. One-time task created without deadline
  - System requires deadline before allowing task creation
  - 'Create Task' button remains disabled until deadline is set
- 7a. Algorithm fails to distribute tasks fairly
  - System falls back to round-robin assignment method
  - System notifies group owner of algorithm failure

<a name="uc19"></a>
<a name="uc20"></a>
#### Use Case 19-20: Rate Roommate and Write Testimonial

**Description**: Group members provide numerical rating and optional written feedback on roommate performance after living together for a minimum of 30 days.

**Primary Actor**: Group Member, Group Owner

**Main Success Scenario**:
1. User navigates to Group Details screen
2. User clicks on a group member to view member details
3. Member details dialog shows ratings and reviews from previous roommates
4. User clicks "Rate User" button
5. Rating dialog opens showing member's name and rating interface
6. User selects rating (1-5 stars) by clicking on star icons
7. User optionally writes testimonial/review in text field (max 500 characters with live character count)
8. Dialog displays note about 30-day requirement: "Both you and the user must have been in the group for at least 30 days to submit a rating"
9. User clicks "Submit" button (disabled until rating is selected)
10. System validates that both users have been in group for 30+ days
11. System submits rating and updates member's average rating
12. Rating dialog closes and member details refresh to show new rating

**Extensions/Failure Scenarios**:
- 10a. Minimum cohabitation period not met (less than 30 days)
  - System displays error message indicating insufficient time in group
  - Rating is not submitted
- 10b. User attempts to rate same roommate multiple times
  - System detects existing rating from user
  - System offers option to update existing rating instead
- 10c. User tries to rate themselves
  - System prevents self-rating with error message
- 9a. User clicks Submit without selecting a rating
  - Submit button is disabled until rating (1-5 stars) is selected
- 7a. Testimonial exceeds 500 characters
  - Input field prevents typing beyond 500 characters
  - Character counter shows limit
- 11a. Network error during rating submission
  - System displays error message
  - User can retry submitting the rating

### **3.6. Screen Mock-ups**

### **3.7. Non-Functional Requirements**

<a name="nfr1"></a>
1. **API Response Time Requirement**
   - **Description**: API response times for login, signup (with all required data entered), message send (not downstream message delivery), and user profile fetch must be under 200ms on Wi-Fi 5+ connection on a 16GB Android phone running Android API 33.
   - **Justification**: According to [UPCore Technologies' mobile app performance research](https://www.upcoretech.com/insights/top-mobile-app-performance-metrics/), "Slow response times are universally detrimental to sentiment, engagement, conversions, and churn. Leading apps deliver response times under 300 ms consistently, with 100 ms or less optimal for interactions. Degraded response times are symptoms of sluggish code and infrastructure." To ensure end-to-end user experience remains under the 300ms threshold for perceived responsiveness, API latency must be kept under 200ms to account for network overhead, client-side rendering, and processing time.
   - **Testing Method**: Use cURL or Postman to send API requests and measure response time from request to 200 OK response.

<a name="nfr2"></a>
2. **Application Load Time Requirement**
   - **Description**: The application cold start (launching app when not in memory) must complete within 5 seconds on a 16GB Android phone running Android API 33 on Wi-Fi 5-7 connection.
   - **Justification**: According to [App Institute's responsiveness research](https://appinstitute.com/improving-app-responsiveness-key-metrics-to-track/), app load time is a critical metric for user retention. Users expect immediate access to functionality, and delays during cold start create negative first impressions and increase abandonment rates. The 5-second threshold ensures users can access core features (group chat, tasks) quickly for time-sensitive household coordination.
   - **Testing Method**: Force stop the app, then use a stopwatch to measure time from tapping the app icon until the first screen is interactive and responsive.

<a name="nfr3"></a>
3. **UI Accessibility Requirement**
   - **Description**: All interactive buttons and touch targets must have a minimum touch target size of 40x40 pixels to ensure accessibility and ease of use.
   - **Justification**: According to [UX Movement's research on optimal button sizing and spacing](https://uxmovement.com/mobile/optimal-size-and-spacing-for-mobile-buttons/), smaller buttons increase error rates and user frustration, particularly for users with motor impairments or when using the app in motion. The 40-pixel minimum provides adequate touch accuracy without requiring excessive screen space.
   - **Testing Method**: Use Android Accessibility Scanner to verify button components meet the 40x40 pixel minimum touch target size.

---

## 4. Designs Specification

### **4.1. Main Components**

1. **Front-End Mobile Application (Android/Kotlin)**
   - **Purpose**: Provides the user interface and handles all user interactions. It enables authentication, profile management, group management, messaging, task management, and roommate rating.
   - **Interfaces**: The front-end communicates with the back-end via HTTP/REST endpoints.
     0. **Health Check Interface**
        - GET /api/health(): HealthResponse
          - Purpose: Checks backend server and database connection status
          - Returns: Server status, database connection status, timestamp, and version information
     1. **Authentication Interface**
        - POST /api/auth/signup(token: String): AuthResponse
          - Purpose: Creates a new user account using Google OAuth token
          - Parameters: Google ID token from OAuth
          - Returns: Success status, user data, and JWT authentication token
        - POST /api/auth/login(token: String): AuthResponse
          - Purpose: Authenticates existing user with Google OAuth token
          - Parameters: Google ID token from OAuth
          - Returns: Success status, user data, and JWT authentication token
     2. **Profile Management Interface**
        - PUT /api/users/profile(name: String, dob: Date, gender: String): UserResponse
          - Purpose: Sets mandatory user profile fields (non-editable after creation)
          - Parameters: Legal name, date of birth, gender
          - Returns: Updated user profile
        - PUT /api/users/optionalProfile(bio?: String, profilePicture?: String, livingPreferences?: LivingPreferences): UserResponse
          - Purpose: Updates optional profile fields (editable anytime)
          - Parameters: Optional bio, profile picture URL, living preferences
          - Returns: Updated user profile
        - DELETE /api/users/me(): SuccessResponse
          - Purpose: Deletes the current user's account
          - Returns: Success confirmation
     3. **Group Management Interface**
        - POST /api/group(name: String): GroupResponse
          - Purpose: Creates a new roommate group with unique invitation code
          - Parameters: Group name (max 100 characters)
          - Returns: Group data including generated group code
        - POST /api/group/join(groupCode: String): GroupResponse
          - Purpose: Joins an existing group using invitation code (validates maximum 8 members)
          - Parameters: 4-character alphanumeric group code
          - Returns: Updated group data with all members, or 400 error if group is full
        - GET /api/group(): GroupResponse
          - Purpose: Retrieves current user's group information
          - Returns: Group data with member details and ratings
        - PUT /api/group/transfer-ownership/:newOwnerId(): GroupResponse
          - Purpose: Transfers group ownership to another member (owner only)
          - Parameters: User ID of new owner
          - Returns: Updated group data with new owner
        - DELETE /api/group/member/:memberId(): GroupResponse
          - Purpose: Removes a member from group (owner only)
          - Parameters: User ID of member to remove
          - Returns: Updated group data
        - DELETE /api/group/leave(): SuccessResponse
          - Purpose: Allows member to leave the group. If owner leaves with other members present, transfers ownership to oldest member (by join date). If owner is alone, deletes the group.
          - Returns: Success confirmation with ownership transfer notification if applicable
     4. **Messaging & Polling Interface**
        - GET /api/chat/:groupId/messages(page?: Number, limit?: Number): MessageListResponse
          - Purpose: Retrieves paginated message history for a group
          - Parameters: Group ID, optional page and limit
          - Returns: Array of messages with pagination info
        - POST /api/chat/:groupId/message(content: String): MessageResponse
          - Purpose: Sends a text message to group chat
          - Parameters: Message content (max 1000 characters)
          - Returns: Created message with sender info
        - POST /api/chat/:groupId/poll(question: String, options: String[], expiresInDays?: Number): MessageResponse
          - Purpose: Creates and sends a poll to group chat
          - Parameters: Poll question, 2-10 answer options, optional expiration days
          - Returns: Created poll message
        - POST /api/chat/:groupId/poll/:messageId/vote(option: String): MessageResponse
          - Purpose: Casts or updates vote on a poll
          - Parameters: Selected option from poll
          - Returns: Updated poll with vote counts
        - DELETE /api/chat/:groupId/message/:messageId(): SuccessResponse
          - Purpose: Deletes own message from chat
          - Parameters: Message ID
          - Returns: Success confirmation
     5. **Task Management Interface**
        - POST /api/task(name: String, difficulty: Number, recurrence: String, requiredPeople: Number, description?: String, deadline?: Date, assignedUserIds?: String[]): TaskResponse
          - Purpose: Creates a new household task
          - Parameters: Task name, difficulty (1-5), recurrence pattern, number of people required, optional description, deadline, assigned users
          - Returns: Created task with assignments
        - GET /api/task(): TaskListResponse
          - Purpose: Retrieves all tasks for current user's group
          - Returns: Array of tasks with assignment details
        - GET /api/task/my-tasks(): TaskListResponse
          - Purpose: Retrieves tasks assigned to current user for current week
          - Returns: Array of assigned tasks
        - GET /api/task/date/:date(): TaskListResponse
          - Purpose: Retrieves tasks for a specific date (for calendar view)
          - Parameters: Date string (ISO format)
          - Returns: Tasks with assignments for that date
        - GET /api/task/week/:weekStart(): TaskListResponse
          - Purpose: Retrieves tasks for a specific week
          - Parameters: Week start date
          - Returns: Tasks with assignments for that week
        - PUT /api/task/:id/status(status: String): TaskResponse
          - Purpose: Updates status of assigned task
          - Parameters: Task status (incomplete, in-progress, completed)
          - Returns: Updated task
        - POST /api/task/:id/assign(userIds: String[]): TaskResponse
          - Purpose: Manually assigns task to specific users for current week
          - Parameters: Array of user IDs
          - Returns: Task with updated assignments
        - POST /api/task/assign-weekly(): TaskAssignmentResponse
          - Purpose: Algorithmically assigns all tasks for the current week
          - Returns: All tasks with new weekly assignments
        - GET /api/task/week/:weekStart(): TaskListResponse
          - Purpose: Retrieves tasks for a specific week
          - Parameters: Week start date
          - Returns: Tasks with assignments for that week
        - DELETE /api/task/:id(): SuccessResponse
          - Purpose: Deletes a task (creator or owner only)
          - Parameters: Task ID
          - Returns: Success confirmation
     6. **Rating & Moderation Interface**
        - POST /api/rating(ratedUserId: String, groupId: String, rating: Number, testimonial?: String): RatingResponse
          - Purpose: Submits or updates rating for a roommate (requires 30 days cohabitation)
          - Parameters: User ID to rate, group ID, rating (1-5), optional testimonial (max 500 chars)
          - Returns: Created/updated rating
        - GET /api/rating/:userId(): RatingStatsResponse
          - Purpose: Retrieves all ratings for a user
          - Parameters: User ID
          - Returns: Array of ratings with average rating and total count
        - GET /api/rating/user/:userId/group/:groupId(): RatingStatsResponse
          - Purpose: Retrieves ratings for a user in a specific group
          - Parameters: User ID, group ID
          - Returns: Group-specific ratings and average
        - PUT /api/users/report(reportedUserId: String, reason: String, context?: String): ReportResponse
          - Purpose: Reports inappropriate user behavior for LLM review
          - Parameters: Reported user ID, reason for report, optional context
          - Returns: Report submission confirmation

2. **Back-End Server (Node.js/TypeScript)**
   - **Purpose**: Manages business logic, authentication, database interactions, group algorithms, and communication between front-end and database.
   - **Internal Component Interfaces**:
     1. **Authentication Service (AuthService)**
        - signup(email: String, name: String, googleId: String): Promise<AuthResult>
          - Purpose: Creates new user account and generates JWT token
          - Validates Google credentials and ensures unique user
        - login(email: String): Promise<AuthResult>
          - Purpose: Authenticates existing user and generates JWT token
          - Verifies user exists and returns user data with token
        - protect(req: Request, res: Response, next: NextFunction): void
          - Purpose: Middleware to verify JWT token and authenticate requests
          - Decodes token and attaches user data to request object
     2. **Database Access Layer (MongoDB/Mongoose Models)**
        - User.create(userData: UserData): Promise<User>
          - Purpose: Creates new user document in database
        - User.findById(id: String): Promise<User>
          - Purpose: Retrieves user by ID
        - Group.create(groupData: GroupData): Promise<Group>
          - Purpose: Creates new group with auto-generated unique code
        - Group.findOne(query: Object): Promise<Group>
          - Purpose: Finds single group matching query criteria
        - Task.find(query: Object): Promise<Task[]>
          - Purpose: Retrieves tasks matching query criteria
        - Message.create(messageData: MessageData): Promise<Message>
          - Purpose: Creates new message document
        - Rating.getAverageRating(userId: String): Promise<RatingStats>
          - Purpose: Calculates average rating for a user
     3. **WebSocket Service (Socket.IO)**
        - getIO(): Server
          - Purpose: Returns Socket.IO server instance for real-time communication
        - joinRoom(socket: Socket, groupId: String): void
          - Purpose: Adds socket connection to group room for message broadcasting
        - emit(event: String, data: Object): void
          - Purpose: Broadcasts real-time events to connected clients
     4. **Task Assignment Algorithm**
        - assignTasksWeekly(groupId: String): Promise<Task[]>
          - Purpose: Fairly distributes tasks among group members for current week
          - Uses randomization and required people count for balanced allocation

3. **LLM Moderation Integration (External Module - MVP)**
   - **Purpose**: Provides automated content moderation for reported user behavior via OpenAI API.
   - **Current Implementation**:
     - Analyzes reported users' message history (up to 100 messages) to detect policy violations
     - Returns isOffensive boolean flag via JSON response
     - Triggers database update to mark offensive users
   - **Future Enhancements**:
     - Automatic testimonial review on creation
     - Automated profile content scanning

### **4.2. Databases**

1. **MongoDB**
   - **Purpose**: Stores persistent data for the application, including user profiles, group information, tasks, chat history, ratings, and moderation reports. MongoDB's document-based model supports dynamic schemas, which is suitable for evolving profile structures, group data, and task allocation.
   - **Collections**:
     - **Users**: email (unique), name, googleId (unique), dob, gender (Male/Female/Prefer-not-to-say), profileComplete (boolean), bio (max 500 chars), profilePicture (URL), averageRating (0-5), livingPreferences (schedule: Morning/Night/Flexible, drinking: None/Occasional/Regular, partying: None/Occasional/Regular, noise: Quiet/Moderate/Loud, profession: Student/Worker/Unemployed), groupName, isOffensive (boolean for moderation flag)
     - **Groups**: name (max 100 chars), groupCode (unique 4-char alphanumeric), owner (User reference), members (array of {userId: User reference, joinDate: Date, moveInDate: Date})
     - **Messages**: groupId (Group reference), senderId (User reference), content (max 1000 chars), type (text/poll), pollData (for polls: question max 200 chars, options array max 100 chars each, votes array with {userId, option, timestamp}, expiresAt: Date default 7 days), createdAt timestamp.
     - **Tasks**: name (max 100 chars), description (max 500 chars), groupId (Group reference), createdBy (User reference), difficulty (1-5 integer), recurrence (daily/weekly/bi-weekly/monthly/one-time), requiredPeople (1-10 integer), deadline (Date, required for one-time tasks), assignments (array of {userId: User reference, weekStart: Date, status: incomplete/in-progress/completed, completedAt: Date}).
     - **Ratings**: ratedUserId (User reference), raterUserId (User reference), groupId (Group reference), rating (1-5 integer), testimonial (max 500 chars), timeSpentMinutes (auto-calculated from group join dates), createdAt timestamp. Unique constraint on (ratedUserId, raterUserId, groupId) to prevent duplicate ratings.

### **4.3. External Modules**

External modules are third-party services accessed over the internet that provide functionality not implemented within the RoomSync application.

1. **Google OAuth 2.0 API**
   - **Provider**: Google Identity Platform
   - **Purpose**: Provides secure authentication and identity verification. Allows users to sign up and log in using their existing Google accounts without requiring password management in the RoomSync system.
   - **Integration**: Used via google-auth-library npm package. The Android client obtains an ID token from Google Sign-In, which is sent to the Node.js backend for verification against Google's servers.
   - **Data Exchanged**: Receives user's email, name, and unique Google ID upon successful authentication.

2. **LLM Moderation System (MVP Feature)**
   - **Provider**: OpenAI API (accessed via OpenRouter)
   - **Purpose**: Analyzes reported user behavior by reviewing message history to detect harassment, hate speech, threats, sexual harassment, and other violations.
   - **Integration**: Used via OpenAI npm package with OpenRouter proxy. When a user is reported, the system fetches up to 100 recent messages from the reported user and sends them to GPT-3.5-turbo with a moderation prompt. The LLM returns a JSON response indicating whether the content is offensive.
   - **Data Exchanged**: Sends message content and reporter's reason; receives JSON response with isOffensive boolean.
   - **Action**: If flagged as offensive, the user's isOffensive field is set to true in the database.

### **4.4. Frameworks and Libraries**

Frameworks and libraries are software packages that provide reusable functionality and are integrated into the application codebase, as opposed to external APIs which are accessed over the network.

**Front-End (Android/Kotlin):**

1. **Jetpack Compose**
   - **Type**: Android UI Framework
   - **Purpose**: Modern declarative UI toolkit for building native Android interfaces. Provides composable functions for creating layouts, managing state, and handling user interactions.
   - **Reason**: Required by course assignment. Replaces legacy XML-based Views with a more maintainable Kotlin-based approach. Integrates seamlessly with Kotlin coroutines and ensures API 33 compatibility.

2. **Retrofit**
   - **Type**: HTTP Client Library
   - **Purpose**: Type-safe REST client for Android that handles HTTP requests to the Node.js backend. Converts API responses to Kotlin data classes automatically.
   - **Usage**: Defines interface (ApiService.kt) with annotations like @POST("api/auth/login") to call backend endpoints.

3. **Kotlin Coroutines**
   - **Type**: Concurrency Library
   - **Purpose**: Manages asynchronous operations (network calls, database queries) without blocking the UI thread. All Retrofit API calls use suspend functions for non-blocking execution.

4. **Navigation Compose**
   - **Type**: Navigation Framework
   - **Purpose**: Handles screen navigation and routing in Jetpack Compose. Manages navigation graph and backstack.
   - **Usage**: Defines routes (NavRoutes.AUTH, NavRoutes.HOME, etc.) and handles navigation between screens with type-safe arguments.

5. **Socket.IO Client**
   - **Type**: Real-Time Communication Library
   - **Purpose**: Enables WebSocket connections from Android client to backend server for real-time chat message delivery.
   - **Usage**: Connects to backend Socket.IO server, listens for "new-message" events, and updates UI in real-time.

6. **Coil**
   - **Type**: Image Loading Library
   - **Purpose**: Asynchronously loads and caches images (profile pictures) in Compose UI. Kotlin-first library optimized for Jetpack Compose.
   - **Usage**: AsyncImage composable to load profile pictures from URLs with placeholder and error handling.

7. **Google Play Services Auth**
   - **Type**: Authentication Library
   - **Purpose**: Provides Google Sign-In functionality on Android. Generates Google ID tokens for OAuth authentication.
   - **Usage**: Launches Google Sign-In intent, receives ID token, and sends to backend for verification.

**Back-End (Node.js/TypeScript):**

8. **Express.js**
   - **Type**: Web Application Framework
   - **Purpose**: Lightweight framework for building RESTful APIs in Node.js. Handles routing, middleware, request/response processing, and HTTP server management.
   - **Usage**: All API routes (/api/auth, /api/group, /api/task, etc.) are defined using Express routers.

9. **Mongoose**
   - **Type**: Object Document Mapper (ODM) Library
   - **Purpose**: Provides schema-based modeling layer for MongoDB. Defines data structures, validation rules, and relationships between collections. Integrates TypeScript types with database operations.
   - **Usage**: Models for User, Group, Task, Message, and Rating define the database schema and provide query methods.

10. **Socket.IO**
   - **Type**: Real-Time Communication Library
   - **Purpose**: Enables bidirectional WebSocket connections between server and Android clients for instant message delivery. Automatically falls back to HTTP long-polling if WebSockets are unavailable.
   - **Usage**: Broadcasts new messages to all clients in a group room using io.to(groupId).emit('new-message', data).

11. **JSON Web Token (jsonwebtoken)**
   - **Type**: Authentication Library
   - **Purpose**: Generates and verifies JWT tokens for stateless authentication. Tokens are signed with HS256 algorithm and include user ID payload.
   - **Usage**: After Google OAuth verification, server issues a JWT that clients include in the Authorization header for protected routes.

12. **google-auth-library**
   - **Type**: Google Authentication Client Library
   - **Purpose**: Verifies Google OAuth ID tokens received from the Android client. Validates token signatures against Google's public keys.
   - **Usage**: verifyIdToken() method extracts user email, name, and Google ID from tokens.

13. **OpenAI**
   - **Type**: AI/LLM Integration Library
   - **Purpose**: Provides access to OpenAI's GPT models for content moderation. Analyzes reported user messages to detect violations.
   - **Usage**: Used via OpenRouter proxy to send message batches to GPT-3.5-turbo for automated moderation analysis, returns JSON with isOffensive boolean.

**Programming Languages:**

- **Kotlin**: Statically-typed JVM language for Android development. Required by course assignment. Provides null safety, coroutines, and modern functional programming features.
- **TypeScript**: Strongly-typed superset of JavaScript for backend development. Required by course assignment. Provides compile-time type checking and enhanced IDE support.

**Runtime Environments:**

- **Android Runtime (ART)**: Executes Kotlin bytecode on Android devices (API 33 minimum).
- **Node.js v18+**: JavaScript runtime for executing TypeScript (compiled to JavaScript) on the server.

**Database:**

- **MongoDB**: NoSQL document database storing all persistent application data in JSON-like BSON format. Collections include Users, Groups, Messages, Tasks, and Ratings. On Atlas exactly like localhost ie no other features being used.

**Cloud Infrastructure:**

- **Google Cloud Platform (GCP)**: Cloud infrastructure provider hosting the Node.js backend and MongoDB database on Compute Engine VMs. Provides scalable, reliable infrastructure with 99.95% uptime SLA. Required by course assignment.

### **4.5. Dependencies Diagram**

<img width="968" height="690" alt="image" src="https://github.com/user-attachments/assets/044e0ed9-c384-4991-9196-a4a55a8fd3fe" />

*RoomSync high level design*

**System Architecture:** The RoomSync system follows a client-server architecture with three main tiers:

1. **Presentation Tier**: Android mobile application (Kotlin/Jetpack Compose)
2. **Application Tier**: Node.js/TypeScript backend server with decomposed service modules
3. **Data Tier**: MongoDB database and Google Cloud infrastructure

**Backend Component Decomposition:** The server is organized into domain-specific modules:

- **Authentication Service** (src/services/auth.ts, src/controller/auth.ts): Handles Google OAuth verification, JWT generation, and user session management
- **User Management Service** (src/controller/user.ts, src/routes/user.ts): Manages user profiles, preferences, and account operations
- **Group Management Service** (src/routes/group.ts): Handles group creation, joining, member management, and ownership transfers
- **Chat Service** (src/routes/chat.ts, src/socket/socketHandler.ts): Manages real-time messaging, message history, polls, and WebSocket connections
- **Task Management Service** (src/routes/task.ts): Handles task creation, assignment algorithms, status tracking, and weekly scheduling
- **Rating Service** (src/routes/rating.ts): Manages roommate ratings, testimonials, and average rating calculations
- **Moderation Service** (src/controller/report.ts): Handles user reporting (LLM integration planned but not yet active in MVP)

**Component Dependencies:**

- **Frontend** → Google OAuth 2.0 API (for authentication)
- **Frontend** → Backend Services (via REST API and WebSocket)
- **Authentication Service** → Google OAuth 2.0 API (token verification)
- **Authentication Service** → MongoDB User Collection
- **All Backend Services** → Authentication Middleware (protect) for request authorization
- **Chat Service** → Socket.IO for real-time message broadcasting
- **Chat Service** → MongoDB Message Collection
- **Group Management** → MongoDB Group Collection
- **Group Management** → User Management (to update user.groupName)
- **Task Management** → MongoDB Task Collection
- **Task Management** → Group Management (to retrieve member lists for assignment algorithm)
- **Rating Service** → MongoDB Rating Collection
- **Rating Service** → User Management (to update user.averageRating)
- **Moderation Service** → Chat Service (to review reported messages)
- **All Services** → MongoDB via Mongoose ODM
- **Backend Server** → Google Cloud Compute Engine (deployment)
- **MongoDB** → Google Cloud Compute Engine (hosted on same or separate VM)

### **4.6. Use Case Sequence Diagram (5 Most Major Use Cases)**

The following sequence diagrams illustrate how the components and interfaces defined in the high-level design interact to realize the five most critical use cases of the RoomSync application.


1. [**Use Case 1: Login Account**](#uc1)
![Use Case Diagram](./images/sequence1.png)

2. [**Use Case 9: Create Group**](#uc9)
![Use Case Diagram](./images/sequence2.png)


3. [**Use Case 15: Send Message**](#uc15)
```mermaid
sequenceDiagram
    actor User
    participant F as :Frontend
    participant CR as :ChatRepository
    participant AS as :ApiService
    participant CH as :ChatHandler
    participant M as :AuthMiddleware
    participant D as :MongoDB
    participant S as :SocketIO
    participant O as :OtherClients

    User->>F: Type message and click "Send"
    F->>CR: sendMessage(groupId, content)
    CR->>AS: POST /api/chat/:groupId/message
    AS->>CH: HTTP Request with JWT
    CH->>M: Verify JWT token
    M->>CH: Attach authenticated user
    CH->>CH: Validate message content (empty, length, ObjectId)
    CH->>D: Group.findById(groupId)
    D->>CH: Return group document
    CH->>CH: Verify user is group member
    alt User not member
        CH->>AS: Return 403 Forbidden
        AS->>CR: HTTP 403 Response
        CR->>F: MessageResponse(success: false)
        F->>User: Display error
    else User is member
        CH->>D: Message.create({groupId, senderId, content, type})
        D->>CH: Return created message document
        CH->>D: message.populate('senderId', 'name')
        D->>CH: Return message with populated sender
        CH->>S: Broadcast new-message event to groupId room
        S->>O: Emit new-message with data
        O->>O: Display message in real-time
        CH->>AS: Return MessageResponse(success: true)
        AS->>CR: HTTP 201 Response
        CR->>F: MessageResponse(success: true)
        F->>User: Display sent message
    end
```

4. [**Use Case 17: Add Task**](#uc17)
```mermaid
sequenceDiagram
    actor User
    participant F as :Frontend
    participant TR as :TaskRepository
    participant AS as :ApiService
    participant TH as :TaskHandler
    participant M as :AuthMiddleware
    participant D as :MongoDB

    User->>F: Fill task form (name, difficulty, recurrence)
    User->>F: Click "Create Task"
    F->>TR: createTask(taskData)
    TR->>AS: POST /api/task
    AS->>TH: HTTP Request with JWT
    TH->>M: Verify JWT token
    M->>TH: Attach authenticated user
    TH->>TH: Validate task parameters (name, difficulty, recurrence, requiredPeople)
    TH->>D: Group.findOne({'members.userId': userId})
    D->>TH: Return group document
    alt User not in group
        TH->>AS: Return 404: Not in any group
        AS->>TR: HTTP 404 Response
        TR->>F: TaskResponse(success: false)
        F->>User: Display error
    else User in group
        TH->>D: Task.create({name, difficulty, recurrence, groupId, createdBy})
        D->>TH: Return created task document
        alt Specific users assigned
            TH->>TH: Calculate current week start
            loop For each userId in assignedUserIds
                TH->>D: task.assignments.push({userId, weekStart, status})
            end
            TH->>D: task.save()
            D->>TH: Confirm assignments created
        end
        TH->>D: task.populate('createdBy', 'name email')
        TH->>D: task.populate('assignments.userId', 'name email')
        D->>TH: Return populated task document
        TH->>AS: Return TaskResponse(success: true)
        AS->>TR: HTTP 201 Response
        TR->>F: TaskResponse(success: true)
        F->>User: Display task in task list
        F->>User: Show assigned members
    end
```

5. [**Use Case 19-20: Rate Roommate and Write Testimonial**](#uc19)
```mermaid
sequenceDiagram
    actor User
    participant F as :Frontend:
    participant R as :Rating:
    participant U as :UserDB:
    participant G as :GroupDB:

    User->>F: Select roommate to rate
    F->>R: POST /api/rating [requestedUser: r, ratedUser: u, groupId: g, rating: r, testimonial: t]

    %% Backend validation
    R->>U: isValid(u)
    alt isValid(u) == true
        U-->>R: 

        %% Check both users in group
        R->>G: SELECT * FROM groups WHERE id = g
        G-->>R: Return group with members and join dates

        R->>R: Verify both users in group
        R->>R: Calculate shared days in group
        alt shared days > 30
            R->>R: Validate rating (1–5) and testimonial length
            alt 1 <= r <= 5 && t.length() <= 500
                R->>R: r
                alt r != u
                    R->>R: UPSERT rating (ratedUser, raterUser, groupId, rating, testimonial)
                    R->>R: Compute average rating for rated user
                    R->>U: UPDATE user averageRating
                    U-->>R: Confirm update
                    R-->>F: Return success (rating saved)
                    F-->>User: "Rating submitted successfully!"
                else 
                    R-->>F: Return 400 (Cannot rate self)
                    F-->>User: "You cannot rate yourself"
            else 
                R-->>F: Return 400 (Validation failed)
                F-->>User: "Rating must be an integer between 1 and 5 and Testimonial must be 500 characters or less"
        else shared days <= 30
            R-->>F: Return 400 (Minimum duration not met)
            F-->>User: "Cannot rate user who has been in group for less than 30 days"
    else isValid(u) == false
        U-->>R: Invalid
        R-->>F: Return 400 (Invalid user)
        F-->>User: "Missing required fields: ratedUserId"
                end
            end
        end
    end
```


### **4.7. Design of Non-Functional Requirements**

1. [**API Response Time Requirement**](#nfr1)
   - **Implementation**: The code is optimized to minimize unnecessary API calls between the front and backend to reduce API latency, keeping response times under 200ms. In the backend, to accelerate look ups and searches for users or groups, rather than using entire user fields, we only search for them according to their email or id, reducing query time and payload size.

2. [**UI Accessibility Requirement**](#nfr3)
   - **Implementation**: We use three types of buttons in our code, Button, IconButton, and FloatingActionButton. Each button has a size of 40 or 56 dp/pixels which ensures that the button is visible to the user at all times, even on smaller screens, making the buttons easy to access and meeting the requirement that all buttons should be at least 40 pixels.

3. [**Application Load Time Requirement**](#nfr2)
   - **Implementation**: To ensure the app loads within 5 seconds, we organized and sectioned off our code so that only critical screens are loaded first while non essential resources such as images are loaded asynchronously. By making sure we have minimal startup dependencies, such that onCreate(), only essential tasks are loaded. This ensures efficient cold start performance.
