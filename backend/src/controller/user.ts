// import { Request, Response } from 'express';
// import { UserModel } from '../models/User';

// export const UserController = {
//   setProfile: async (req: Request, res: Response) => {
//     const { email, dob, gender } = req.body;



//     //validate inputs
//     if (!email || !dob || !gender) {
//       return res.status(400).json({ success: false, message: 'Email, DOB, and gender are required' });
//     }
//     if (!['Male', 'Female', 'Prefer-not-to-say'].includes(gender)) {
//       return res.status(400).json({ success: false, message: 'Invalid gender value' });
//     }

//     try {
//       //find user by email and verify against JWT
//       const user = await UserModel.findOne({ email, _id: (req as any).user.id });
//       if (!user) {
//         return res.status(404).json({ success: false, message: 'User not found or unauthorized' });
//       }

//       //enforce immutability
//       if (user.dob || user.gender) {
//         return res.status(400).json({ success: false, message: 'DOB and gender cannot be changed once set' });
//       }

//       //validate DOB format (expects 'YYYY-MM-DD')
//       const dobDate = new Date(dob);
//       if (isNaN(dobDate.getTime())) {
//         return res.status(400).json({ success: false, message: 'Invalid DOB format' });
//       }

//       // Update user
//       user.dob = dobDate;
//       user.gender = gender;
//       user.profileComplete = true;
//       await user.save();

//       return res.json({
//         success: true,
//         message: 'Profile updated successfully',
//         user: {
//           email: user.email,
//           name: user.name,
//           dob: user.dob,
//           gender: user.gender,
//           profileComplete: user.profileComplete,
//           groupName: null,
//         },
//       });
//     } catch (err) {
//       console.error(err);
//       return res.status(500).json({ success: false, message: 'Server error' });
//     }
//   },
// };


import { Request, Response } from 'express';
import { UserModel } from '../models/User';

export const UserController = {
  setProfile: async (req: Request, res: Response) => {
    const { email, dob, gender } = req.body;

    //validate inputs
    if (!email || !dob || !gender) {
      return res.status(400).json({ success: false, message: 'Email, DOB, and gender are required' });
    }
    
    if (!['Male', 'Female', 'Prefer-not-to-say'].includes(gender)) {
      return res.status(400).json({ success: false, message: 'Invalid gender value' });
    }

    try {
      //find user by email (remove JWT check)
      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      //enforce immutability
      if (user.dob || user.gender) {
        return res.status(400).json({ success: false, message: 'DOB and gender cannot be changed once set' });
      }

      //validate DOB format (expects 'YYYY-MM-DD')
      //NEED TO LATER ADD to handle other formats and error for invalid date inputs
      const dobDate = new Date(dob);
      if (isNaN(dobDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid DOB format' });
      }
    // console.log('Parsed DOB:', dobDate);

      // Update user
      user.dob = dobDate;
      user.gender = gender;
      user.profileComplete = true;
      await user.save();

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          email: user.email,
          name: user.name,
          dob: user.dob,
          gender: user.gender,
          profileComplete: user.profileComplete,
          groupName: user.groupName || null,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },
};