# Requirements and Design

## 1. Change History

| **Change Date** | **Modified Sections** | **Rationale** |
| --------------- | --------------------- | ------------- |
| September 26, 2025 | Initial Plan | First milestone submission (M2) |
| October 10, 2025 | Section 3.2 Use case diagram | Fixed use case diagram according to feedback in M2 |
| October 28, 2025 | Added section 4.4, 4.6, 4.7, Modified section 3.1, 4.5 | M3 Requirements, fixed document according to app implementation |

---

## 2. Project Description

RoomSync is a comprehensive roommate management application designed to streamline the process of connecting with and living harmoniously with roommates. The app addresses common challenges in shared living situations by providing tools for communication, task management, and accountability through a rating system.

The application targets university students, young professionals, and anyone seeking or currently residing in a shared accommodation. RoomSync facilitates the entire roommate lifecycle– from viewing roommates track records to pick a 'good roommate', through creating a space to encourage communication and task coordination, to providing feedback and ranking that helps build trustworthy roommate profiles for future living arrangements.

---

## 3. Requirements Specification

### **3.1. List of Features**

**User Authentication** - Secure user sign up or login using Google authentication service.

**User Profile Management** - An user must fill out all mandatory fields (section a), upon user profile creation. Users can also choose to fill out optional fields (section b). Editable fields can be changed anytime in the user management page whereas non-editable fields can't be changed after account creation. User profiles can be shared for housing/roommate applications

- **Mandatory/Not editable (kept private)**
  - Name (Legal first and last name)
  - DOB
  - Gender
  - Email (this will be automatically filled out after creating an account through Google user authentication)
- **Optional/editable**
  - Bio
  - Profile picture
  - Living preference/expectations (ex. morning/night person, drinking, partying, noise, profession/student)

**Group Management** – Users have an option to either create a new group or join an existing group.

- **Create Group**: Must enter group name (editable) and a unique group (not editable) code will be created. This group code can be shared.
- **Join Group**: Users can enter a unique group code to join a group.
- **Maximum 8 users in a group**: Additional users will be unable attempt to join group
- **View Group**: See group members profiles, name of group and each member's move-in date/group join date.
- **Leave Group**: Any user part of a group can leave the group. When the owner leaves, ownership automatically transfers to the oldest member (by join date). If the owner is the only member, the group is deleted.

**Group Communication** - Real-time messaging system with all group members. Integrated polling functionality to block certain times on the calendar for group decisions with default options: yes or no. Polls will expire within a week.

**Group Task Management** - Algorithmic task assignment and tracking system for household responsibilities

- **View Tasks**: Three view options - Calendar View (tasks by selected date), Weekly View (all group tasks grouped by day), My Tasks (personal tasks grouped by day).
- **Set Task Status**: Default status is 'incomplete'. Users can update to 'in-progress' or 'completed'.
- **Create Task**: Enter task name, optional description, difficulty (1-5), recurrence (one-time/daily/weekly/bi-weekly/monthly), required people (1-10), deadline (for one-time tasks), and optional member assignment.
- **Task Assignment**: Tasks assigned weekly via algorithm for fair distribution, or manually assigned at creation to specific members.

**Roommate Rating System** - Users can rate roommate experience after living with them for a minimum of 30 days.

- **Rating** - Reputation score: Users can give their roommates a score out of 5 and leave comments and testimonies to describe their personal living experience
- While bad roomates might be able to delete account or not have one, it is still a good way for good roommates to build up a track record of cleanliness for future rooms. This has been proven to work like Ebay or Facebook marketplace.

**User Moderation** - Automated content moderation using LLM

- Users can report inappropriate behavior. The system analyzes the reported user's recent messages (up to 100) using OpenAI to determine if content violates community standards (harassment, hate speech, threats, etc.).
- If deemed offensive, the user is flagged in the database (isOffensive field set to true).

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
1. **Create account** – Secure account creation using Google OAuth (interaction with Google OAuth 2.0 API)  
2. **Login** – Secure account login using Google OAuth (interaction with Google OAuth 2.0 API)  
3. **Logout** – User logs out of the application, clearing locally stored authentication tokens  

#### **Use cases for User Profile Management**
4. **Set mandatory profile fields** – Users must provide legal name, date of birth, and gender upon account creation (one-time, non-editable)  
5. **Update nickname and bio** – Users can choose a nickname and update their bio text  
6. **Update living preferences** – Users can indicate living preferences by selecting schedule, drinking, partying, noise, and profession descriptions  
7. **Update profile picture** – Users can add, change, or remove their profile picture  
8. **Delete account** – Users can permanently delete their account and all associated data  

#### **Use cases for Group Management**
9. **Create group** – Establish a new living group and generate a unique invitation code for prospective roommates
10. **Join group** – Join an existing roommate group by entering a unique 4 digit alphanumeric invitation code
11. **View group** – View members of the group, group name, and member join dates
12. **Leave group** – Group members can leave a group they are a part of (owner leaving should transfer to oldest member in the group if it is just them it will delete group instead)
13. **Delete group** – Group owner can dissolve a group; the unique invitation code will no longer be valid
14. **Remove group member** – Group owner can remove group members

#### **Use cases for Group Communication**
15. **Send message** – Real-time messaging system for communication between all group members  
16. **Create poll** – A voting mechanism for group decisions regarding household policies and activities  

#### **Use cases for Group Task Management**
17. **Add task** – Create tasks with name, description, difficulty (1-5), recurrence, deadline (for one-time tasks), and optional member assignment. View tasks in Calendar, Weekly, or My Tasks views  
18. **Delete task** – Delete tasks if a task is no longer needed  
29. **Set task status** – Update task status to *in-progress* or *completed* for assigned tasks  

#### **Use cases for Roommate Rating System**
20. **Rate roommate** – Rate roommate performance (1–5 stars) after living together for a minimum of 30 days  
21. **Write testimonial** – Add optional written feedback about roommate experience  
22. **View ratings** – View user profiles, average ratings, and testimonials from previous roommates  

#### **Use cases for User Moderation**
23. **Report user** – Report inappropriate user behavior for review  

### **3.5. Formal Use Case Specifications (5 Most Major Use Cases)**

<a name="uc1"></a>
#### Use Case 1: Create account

**Description**: Secure account creation process using Google OAuth. User profiles will also be created.

**Primary Actor**: Non-Group Member

**Main success scenario**:
1. A person with an existing google account clicks 'create account'
2. Selects the google account they want to use to create account in pop-up
3. Checks account with that google account can be created
4. User is asked to fill out a user profile. Must fill out mandatory fields, including full legal name, date of birth, and gender.
5. User clicks 'next'
6. Users can fill out optional fields: nickname, bio, select living preferences and upload a profile picture. Message informs users that these fields are optional.
7. User clicks 'finish'
8. Message that confirms account creation will be displayed

**Failure scenario(s)**:
- 3a. A user who has an existing account tries to create an account
  - System displays an error message saying that an account associated with that google account already exists and suggests logging in instead
- 5a. User clicks finished but one or more mandatory fields are left empty
  - System displays an error message saying that all mandatory fields must be completed
- 5b. User clicks finished but one or more mandatory fields don't meet requirements
  - System displays an error message saying name must be below 100 characters
  - System displays an error message saying that the birthday is set to the future and is invalid.
- 6a. User uploads profile picture file that is too large
  - System displays an error message saying that the file is too large
- 7a. User clicks finished but one or more optional fields don't meet requirements
  - System displays an error message saying nickname must be below 100 characters
  - System displays an error message saying bio must be below 100 words

<a name="uc9"></a>
#### Use Case 9: Create Group

**Description**: Non-Group Member establishes a new roommate group and receives invitation code to share with potential roommates.

**Primary Actor**: Non-Group Member

**Main Success Scenario**:
1. User navigates to group creation page
2. User enters group name
3. User clicks 'confirm' to create group
4. System generates and displays an unique invitation code
5. System creates a group with the user as group owner, along with saving the group name and the unique invitation code to identify the group.
6. System displays group dashboard displaying the group name and invitation code
7. The group owner can share the invitation code with potential roommates who can join the group.

**Failure Scenarios**:
- 2a. Group name is left empty
  - System displays error saying that a group name must be entered
- 2b. Group name is longer than 100 characters
  - System displays error saying that a group name must be less than 100 characters
- 3a. User already belongs to a group
  - System displays error that user must leave current group first to create a group
  - User is redirected to current group dashboard

<a name="uc16"></a>
<a name="uc17"></a>
#### Use Case 17: Create Poll

**Description**: Group members can create and send polls for household decisions in group chat.

**Primary Actor**: Group Member, Group Owner

**Main Success Scenario**:
1. User opens group chat interface
2. User clicks "Create Poll" button
3. User enters poll question and answer options. Default options of yes or no will be automatically provided
4. User sends the poll to chat.
5. System broadcasts the poll to all group members in real-time
6. Other group members receive message notifications
7. Group members can vote on poll options by clicking on the options
8. System displays results when poll closes automatically after 1 week or when all members have voted

**Failure Scenarios**:
- 3a. Poll creation with invalid parameters
  - System displays error message saying that a question and at least two options must be present
- 3b. Poll creation with invalid length
  - System displays an error message saying that option names should be less than 100 characters and questions should be less than 50 words.
- 4a. Message fails to send due to network issues
  - System shows "message failed" indicator. Suggests sending poll at a later time.
  - User can retry sending message
- 5a. Real-time connection lost
  - System attempts to reconnect automatically
  - User sees "reconnecting" status until connection restored

<a name="uc18"></a>
#### Use Case 18: Add Task

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

<a name="uc21"></a>
#### Use Case 21-22: Rate Roommate and Write Testimonial

**Description**: Group members provide numerical rating and optional written feedback on roommate performance after living together for a minimum of 30 days.

**Primary Actor**: Group Member, Group Owner

**Main Success Scenario**:
1. System verifies user has lived with target roommate for a minimum of 30 days by comparing the move-in date and current date.
2. User selects a specific roommate within the same group to rate
3. User enters subjective numerical rating (1-5 scale)
4. User writes optional testimonial/comments
5. User presses 'submit'
6. System sends testimonials to LLM to validate rating content for appropriate language.
7. Once verified, rating is added to roommate's profile
8. System updates roommate's overall rating score

**Extensions/Failure Scenarios**:
- 1a. Minimum cohabitation period not met
  - System displays error message with remaining days needed to rate user
  - User cannot proceed with rating until requirement met
  - User is redirected back to rating selection page
- 2a. User attempts to rate same roommate multiple times
  - System detects existing rating from user
  - System offers option to update existing rating instead
- 2b. User tries to rate themselves
  - System prevents self-rating with error message
  - User is redirected back to rating selection page
- 4a. User doesn't enter any numerical rating from a scale of 1-5
  - System displays error saying that the user must select a rating between 1-5
- 5a. Testimonial/Feedback is too long
  - System displays an error saying testimonial must be under 300 words.
- 7a. Inappropriate content detected in testimonial
  - System flags content for manual review
  - Rating is held pending moderation approval
- 7b. LLM is not functioning
  - System displays error saying that review is submitted but will be reviewed and verified at a later time

### **3.6. Screen Mock-ups**

### **3.7. Non-Functional Requirements**

<a name="nfr1"></a>
1. **API Response Time Requirement**
   - **Description**: API response times for login, signup (with all required data entered), message send (not downstream message delivery), and user profile fetch must be under 200ms on Wi-Fi 5+ connection on a 16GB Android phone running Android API 33.
   - **Justification**: According to UPCore Technologies' mobile app performance research, slow response times are universally detrimental to user sentiment, engagement, conversions, and churn. Leading mobile apps deliver response times under 300ms consistently, with 100ms or less optimal for interactions. Degraded response times are symptoms of sluggish code and infrastructure. To ensure end-to-end user experience remains under the 300ms threshold for perceived responsiveness, API latency must be kept under 200ms to account for network overhead, client-side rendering, and processing time. This 200ms target allows for a 100ms buffer for UI updates and animations while staying within the critical 300ms window that maintains user flow and prevents perceived lag.
   - **Testing Method**: Timing starts when sending a cURL request to the API with required parameters and ends when receiving a 200 OK response from the server. Error responses (400s, 500s) are excluded from measurements as optimization should target successful operations.

<a name="nfr2"></a>
2. **Application Load Time Requirement**
   - **Description**: The application cold start (launching app when not in memory) must complete within 5 seconds on a 16GB Android phone running Android API 33 on Wi-Fi 5-7 connection.
   - **Justification**: According to App Institute's responsiveness research, app load time is a critical metric for user retention. Users expect immediate access to functionality, and delays during cold start create negative first impressions and increase abandonment rates. The 5-second threshold is based on industry benchmarks for productivity apps, balancing the need for quick startup with the complexity of initializing authentication, database connections, and UI components. This ensures users can access core features (group chat, tasks) quickly enough for time-sensitive household coordination scenarios (e.g., coordinating grocery runs, responding to locked-out roommates).
   - **Testing Method**: Time measurement begins when the app icon is tapped on the Android home screen (with app not in memory) and ends when the user can interact with the first screen (login screen for new users, home dashboard for authenticated users).

<a name="nfr3"></a>
3. **UI Accessibility Requirement**
   - **Description**: All interactive buttons and touch targets must have a minimum touch target size of 42x42 pixels to ensure accessibility and ease of use.
   - **Justification**: According to UX Movement's mobile usability research on optimal button sizing and spacing, smaller buttons increase error rates and user frustration, particularly for users with motor impairments, larger fingers, or when using the app in motion (walking between rooms). The 42-pixel minimum is based on empirical studies showing this size provides adequate touch accuracy across diverse user populations without requiring excessive screen space. This is critical for RoomSync's core interactions (sending messages, marking tasks complete, creating polls) which users often perform quickly while multitasking in shared living spaces.
   - **Testing Method**: Automated accessibility testing using Android Accessibility Scanner to verify all button components meet the 42x42 pixel minimum touch target size requirement.

---

## 4. Designs Specification

### **4.1. Main Components**

1. **Front-End Mobile Application (Android/Kotlin)**
   - **Purpose**: Provides the user interface and handles all user interactions. It enables authentication, profile management, group management, messaging, task management, and roommate rating.
   - **Interfaces**: The front-end communicates with the back-end via HTTP/REST endpoints.
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

**Back-End (Node.js/TypeScript):**

4. **Express.js**
   - **Type**: Web Application Framework
- **Purpose**: Lightweight framework for building RESTful APIs in Node.js. Handles routing, middleware, request/response processing, and HTTP server management.
   - **Usage**: All API routes (/api/auth, /api/group, /api/task, etc.) are defined using Express routers.

5. **Mongoose**
   - **Type**: Object Document Mapper (ODM) Library
   - **Purpose**: Provides schema-based modeling layer for MongoDB. Defines data structures, validation rules, and relationships between collections. Integrates TypeScript types with database operations.
   - **Usage**: Models for User, Group, Task, Message, and Rating define the database schema and provide query methods.

6. **Socket.IO**
   - **Type**: Real-Time Communication Library
   - **Purpose**: Enables bidirectional WebSocket connections between server and Android clients for instant message delivery. Automatically falls back to HTTP long-polling if WebSockets are unavailable.
   - **Usage**: Broadcasts new messages to all clients in a group room using io.to(groupId).emit('new-message', data).

7. **JSON Web Token (jsonwebtoken)**
   - **Type**: Authentication Library
   - **Purpose**: Generates and verifies JWT tokens for stateless authentication. Tokens are signed with HS256 algorithm and include user ID payload.
   - **Usage**: After Google OAuth verification, server issues a JWT that clients include in the Authorization header for protected routes.

8. **google-auth-library**
   - **Type**: Google Authentication Client Library
   - **Purpose**: Verifies Google OAuth ID tokens received from the Android client. Validates token signatures against Google's public keys.
   - **Usage**: verifyIdToken() method extracts user email, name, and Google ID from tokens.

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


1. [**Use Case 1: Create Account**](#uc1)
![Use Case Diagram](./images/sequence1.png)

2. [**Use Case 9: Create Group**](#uc9)
![Use Case Diagram](./images/sequence2.png)


3. [**Use Case 16: Send Message**](#uc16)
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

4. [**Use Case 18: Add Task**](#uc18)
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

5. [**Use Case 21-22: Rate Roommate and Write Testimonial**](#uc21)
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
   - **Implementation**: We use three types of buttons in our code, Button, IconButton, and FloatingActionButton. Each button has a size of 48 or 56 dp/pixels which ensures that the button is visible to the user at all times, even on smaller screens, making the buttons easy to access and meeting the requirement that all buttons should be at least 42 pixels.

3. [**Application Load Time Requirement**](#nfr2)
   - **Implementation**: To ensure the app loads within 5 seconds, we organized and sectioned off our code so that only critical screens are loaded first while non essential resources such as images are loaded asynchronously. By making sure we have minimal startup dependencies, such that onCreate(), only essential tasks are loaded. This ensures efficient cold start performance.
