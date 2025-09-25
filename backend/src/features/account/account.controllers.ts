// import { accountService } from "./account.services";

// class accountController {
//   private service: accountService;

//   constructor(service: accountService) {
//     this.service = service;
//   }
//   updateProfile = async (req: Request, res: Response) => {
//     try {
//       const { username } = req.body;
//       const picture = req.file as Express.Multer.File;

//       const result = await this.service.updateProfile(picture, username);
//     } catch (error: unknown) {
//       if (error instanceof Error) {
//         console.log("Error during update profile ERROR:", error.message);
//       } else {
//         console.log("Error during update profile ERROR:", error);
//       }

//       res.status(500).json({
//         message: "Error during update profile",
//       });
//     }
//   };
// }

// export default accountController;
