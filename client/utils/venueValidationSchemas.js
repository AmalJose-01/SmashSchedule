import * as Yup from "yup";
// Validation schema for venue management
export const venueValidationSchemas = Yup.object().shape({
  venueName: Yup.string().required("Venue name is required"),
  location: Yup.string().required("Location is required"),
  availability: Yup.array()
    .of(
      Yup.object().shape({
        day: Yup.string()
          .required("Day is required")
          .oneOf([
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ]),
        timeSlots: Yup.array()
          .of(
            Yup.object().shape({
              startTime: Yup.string().required("Start time is required"),
              endTime: Yup.string()
                .required("End time is required")
                .test(
                  "is-greater",
                  "End time must be later than start time",
                  function (value) {
                    const { startTime } = this.parent;
                    return (
                      !startTime || !value || value > startTime
                    );
                  }
                ),
            })
          )
          .min(1, "At least one time slot is required")
          .required("Time slots are required"),
        enabled: Yup.boolean(),
      })
    )
    .min(1, "At least one availability day is required"),
  status: Yup.string()
    .oneOf(["open", "closed"], "Status must be either 'open' or 'closed'")
    .required("Status is required"),
});
export default venueValidationSchemas;


