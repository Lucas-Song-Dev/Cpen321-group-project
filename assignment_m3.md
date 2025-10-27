CPEN 321 Software Engineering
Winter 2025
M3: (Requirements), Design, MVP. Friday, October 17, 10:59pm.
The deliverable for this milestone is your complete project design and first complete iteration on
your code (MVP). You should also refine your requirements and high-level design, if necessary.
The MVP will be evaluated against your current project requirements. In particular, all project use
cases (functional requirements) have to be implemented, be functional, and demonstrable. Please
note that mismatches between your requirements/design and your implementation will cause you
to lose marks.
You are permitted to use an assistive AI technology while working on the assignment. However,
if you use such technology in any stage of working on the assignment, you must properly document
and critically analyze its use. No points will be deducted for any type of documented use.
Undocumented use will be considered academic misconduct and will be treated accordingly.
Please consult the course syllabus for more details.
This assignment has three parts.
PART I – Refined Project Requirements and Complete Design: For this part of the assignment,
you will be refining your “Requirements_and_Design.md” file (which should be located in the
“documentation” folder of your GitHub Repository and should comply with the provided template,
as specified in M2).
The document should be extended to include at least the changes described below. You can (and
are expected to) make other changes and refinements, as necessary.
1. The “Change History” part should, from now on, contain an entry in the table for each
change made. In the table, list the date of the change, the modified section(s), and the
rationale for the change. Please make sure the rationale is clear and reasonable.
2. Add component interfaces in item 4.1.
• Each interface must have a meaningful name, parameters, and return value, as well as
a short description of its purpose (1-2 sentences).
• You should use Java-style method signatures to describe interactions between your
back-end components (unless you plan to implement them as microservices) and either
Java or HTTP/REST-style interfaces between your front-end and back-end components
and between yours and external components.
3. Complete item 4.4 of the template: You should name the frameworks and libraries you
used in your implementations (e.g., Express.js for web development in Node.js and Retrofit
for making HTTP requests in Android). Using libraries and frameworks is optional. Please
also consult the course syllabus for a discussion on permitted frameworks and libraries.
4. Complete item 4.6 of the template: For each of the 5 most major use cases of your project
(agreed upon with a TA), draw a sequence diagram that describes how components in your
high-level design dependency diagram (represented as lifelines) and their interfaces
(represented as messages) are used to realize the use cases. The sequence diagram should
only use components and interfaces defined in your dependency diagram.
2/3
5. Complete item 4.7 of the template: For each non-functional requirement, describe in 1-2
sentences the implementation that ensures the requirement is realized.
PART II – Working app: This part of the assignment is your working app. It will be graded based
on its scope, completeness, and alignment with requirements and design artifacts.
Prepare a PDF file named “M3_DevelopmentInfo.pdf”, with the following information:
○ A public IP of your back-end server and its domain name (if any).
○ Which features satisfy the project scope requirements (using an external API, live
updates, etc.) and how.
○ A commit hash of your MVP version in Git.
- The working version of your project (MVP) should be in the main branch of
the repository.
- You can continue developing your project (including the main branch) after the
submission.
- Note that we will check that the date of the MVP commit on the main branch
precedes the date of your submission.
Your app must run on at least one physical phone. You will use your phone to demonstrate the
project to a TA in the lab.
PART III – Reflections and Peer Evaluation:
III-a: Prepare a PDF file named “M3_Reflections.pdf”, with the following information.
1. Fill out “Table 1 – Task Distribution” below:
ID Task (a short description) Team Member Duration
1. 3 hours
2. 1 hour
...
2. Fill out “Table 2 – Time and AI Reliance Distribution” below:
Time Spent on the
Assignment (hours)
AI Reliance for the assignment
(0 – 100%) (Estimate)
Team Member 1 Name
Team Member 2 Name
Team Member 3 Name
Team Member 4 Name
Group Overall
3. Your reflections on the use of AI:
à If you, as a group, did not use any AI tools:
3.1 Why did you decide not to use AI?
3/3
3.2 Provide 2-3 concrete examples of AI tools being inadequate for tasks in this
milestone.
à If you did use AI tools:
3.1 Pick 4-5 most major tasks from the table above and specify:
3.1.1 What was your task? (a longer description)
3.1.2 Which AI Interfaces, Tools, and Models have you used for this task?
3.1.3 What was your strategy for utilizing the tool for this task?
3.1.4 What are the advantages of using AI tools (and particular models, if
relevant) for this task?
3.1.5 What are the disadvantages of using AI tools (and particular models, if
relevant) for this task?
3.2 Anything else you would like to share about this process.
III-b: a Zip file named “M3_AI_Interactions.zip”, with PDFs of all your group’s conversations
with AI tools. Each PDF file name should contain the name of the group member involved in the
conversation.
III-c: for your iPeer evaluation mark, please log into the iPeer website
(https://ipeer.elearning.ubc.ca/login) using your CWL username and password and follow the “M3
Evaluation” instructions there.
The evaluation period will end 24 hours after you submit your assignment. Please note that you
will not get any marks for the assignment if you do not evaluate your peers and each day of delay
in the evaluation (counted as full integers) will reduce your individual assignment mark by 20%.
SUBMISSION CHECKLIST
PART I:
• A PDF file named "Requirements_and_Design.pdf", which is identical to the file stored in
Git and includes the abovementioned information.
PART II:
• An Android release APK build of your mobile application. Before submission, make sure
○ the APK can run on an emulator specified in the course syllabus and connects to your
back-end server.
○ your back-end server is up and running until the grades are released.
• A PDF file named "M3_DevelopmentInfo.pdf”.
PART III:
• A PDF file named “M3_Reflections.pdf”.
• A zip file named “M3_AI_Interactions.zip”.
• (No Canvas submission is needed for iPeer evaluation; the submission is done via iPeer).