const buildPlayerMailBody = ({ teamName, tournamentDetail, playerOneName }) => {
  return `
    <h2>🏸 Team Registration Confirmed</h2>

    <p>Hi <strong>${playerOneName}</strong>,</p>

    

    <p>
      Welcome to the <strong>Ballarat Masters Open – Mens Doubles Badminton Tournament</strong>.
      We’re excited to have you registered and look forward to a great day of competitive badminton
      at Ken Kay Badminton Stadium.
    </p>

    <p>
      As we get closer to tournament day, here are a few important updates and reminders.
    </p>

    <h3>🕘 Arrival & Check-In</h3>
    <p>
      Please arrive by <strong>
        ${tournamentDetail?.time || "To be announced"}
        , Saturday, 10 January 2026
      </strong> for check-in and a prompt start.
    </p>

    <h3>🌧️ Footwear Reminder (Weather Advisory)</h3>
    <p>
      There is a <strong>possibility of rain</strong> forecast for Ballarat on
      <strong>Saturday, 10 January 2026</strong>.
    </p>

    <p>To help keep the venue clean and safe:</p>
    <ul>
      <li>Please arrive wearing <strong>runners or outdoor shoes</strong></li>
      <li>Change into <strong>non-marking badminton shoes</strong> inside the stadium</li>
      <li>The courts are timber/wooden – non-marking shoes are strongly recommended</li>
    </ul>

    <p>Thank you for helping us look after the venue!</p>

    <h3>📊 Live Scores, Fixtures & Standings</h3>
    <p>We’ll be using <strong>Smash Schedule</strong> to manage:</p>
    <ul>
      <li>Match fixtures</li>
      <li>Live score updates</li>
      <li>Group standings & progression</li>
    </ul>

    <p>
      * Website:
      <a href="https://smash-schedule.vercel.app/">
        smash-schedule
      </a>
      <br />
      * Viewing Score Access Code:
      <strong>${tournamentDetail?.uniqueKey || "To be announced"}</strong>
    </p>

    <p>
      Scores will be updated throughout the day, so please check the platform regularly.
    </p>

    <h3>🏸 Tournament Format – Important Note</h3>
       <p>

 <ul>
      <li>The tournament is planned for <strong>32 teams</strong> across group stages.</li>
      <li> If fewer than 32 teams participate, the
      <strong>top 8 teams across all groups</strong>
      will progress directly to the
      <strong>quarter-finals</strong>.</li>
    </ul>

     
    </p>

    <h3>🚗 Venue & Parking</h3>
    <ul>
      <li>Plenty of parking available on site</li>
      <li>No food or drink restrictions</li>
    </ul>

    <p>
      If you have any questions, feel free to reply to this email.
      <br /><br />
      We’re looking forward to a great day of badminton.
      See you on court!
    </p>

  <p style="margin-top:30px; text-align:center;">
  Kind regards,<br />
  <strong>Ballarat Masters Badminton Club</strong><br /><br />


</p>
  `;
};
module.exports = buildPlayerMailBody;
