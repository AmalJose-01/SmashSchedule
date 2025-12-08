import * as Yup from "yup";

// Validation schema for tournament setup
 const validationSchemas = Yup.object().shape({
    // teamName: Yup.string().required("Team name is required"),
    playerOneName: Yup.string().required("Player One name is required"),
    playerOneEmail: Yup.string()
      .email("Invalid email format")
      .required("Player One email is required"),
    playerOneContact: Yup.string().required("Player One contact is required"),
    playerOneDOB: Yup.date()
      .max(new Date(), "Date of Birth cannot be in the future")
      .required("Player One date of birth is required"),
    playerTwoName: Yup.string().required("Player Two name is required"),
    playerTwoEmail: Yup.string()
      .email("Invalid email format")
      .required("Player Two email is required"),
    playerTwoContact: Yup.string().required("Player Two contact is required"),
    playerTwoDOB: Yup.date()
      .max(new Date(), "Date of Birth cannot be in the future")
      .required("Player Two date of birth is required"),   
      tournamentName: Yup.string().required("Tournament name is required"), 
      teamsPerGroup: Yup.number().min(2).max(8).required("Teams per group is required"),
        playType: Yup.string().oneOf(["group", "knockout", "group-knockout"]).required("Play type is required"),
        numberOfCourts: Yup.number().min(1).max(20).required("Number of courts is required"),
        // Number of players Qualified to knockout
        playersToQualify: Yup.number().min(1).required("Number of players to qualify is required"),
        email:  Yup.string().email("Invalid email format"),
         password: Yup.string().required("Password is required"),
 })
 export default validationSchemas;
