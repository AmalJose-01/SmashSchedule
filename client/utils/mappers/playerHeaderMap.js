// Column names accepted when importing Singles players (normalised:
// lower-case, no spaces/punctuation). Player-1 columns from the team
// template also work, so the same spreadsheet layout can be reused.
export const PLAYER_HEADER_MAP = {
  name: ["name", "playername", "fullname", "player", "ticketdataplayer1name", "player1name", "playeronename"],
  email: ["email", "emailaddress", "playeremail", "ticketdataplayer1email", "player1email", "email1"],
  contact: ["contact", "phone", "mobile", "mobilenumber", "phonenumber", "contactnumber", "ticketdataplayer1mobilenumber", "player1mobile", "phone1"],
  dob: ["dob", "dateofbirth", "birthdate", "ticketdataplayer1dateofbirth", "player1dob", "dob1"],
  grade: ["grade", "playergrade", "level"],
  memberNo: ["badmintonvictoriamemberno", "badmintonvictoriamembernumber", "bvmemberno", "memberno", "membernumber", "membershipno", "membershipnumber"],
};
