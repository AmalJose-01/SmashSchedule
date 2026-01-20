import * as Yup from "yup";
// Validation schema for venue management
export const venueValidationSchemas = Yup.object().shape({
  venueName: Yup.string().required("Venue name is required"),
  location: Yup.string().required("Location is required"),
  status: Yup.string()
    .oneOf(["open", "closed"], "Status must be either 'open' or 'closed'")
    .required("Status is required"),
    courtName: Yup.string().when("isMultipleCourts", {
      is: false,
      then: Yup.string().required("Court name is required for single court creation"),
      otherwise: Yup.string().notRequired(),
    }),
    courtType: Yup.string().when("isMultipleCourts", {
      is: false,
      then: Yup.string().required("Court type is required for single court creation"),
      otherwise: Yup.string().notRequired(),
    }),
    start: Yup.string().when("isMultipleCourts", {
      is: true,
      then: Yup.string().required("Start value is required for multiple court creation"),
      otherwise: Yup.string().notRequired(),
    }),
    end: Yup.string().when("isMultipleCourts", {
      is: true,
      then: Yup.string().required("End value is required for multiple court creation"),
      otherwise: Yup.string().notRequired(),
    }),
    prefix: Yup.string().when("isMultipleCourts", {
      is: true,
      then: Yup.string().notRequired(),
      otherwise: Yup.string().notRequired(),
    }),
});
export default venueValidationSchemas;


