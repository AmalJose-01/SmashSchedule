import { useState, useRef, useEffect } from "react";
import "./DatePicker.css";

const DatePicker = ({ value, onChange, label, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(
    value ? new Date(value) : new Date(new Date().getFullYear() - 20, 0, 1)
  );
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const pickerRef = useRef(null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleYearChange = (e) => {
    const year = parseInt(e.target.value);
    setCurrentDate(new Date(year, currentDate.getMonth()));
  };

  const handleMonthChange = (e) => {
    const month = parseInt(e.target.value);
    setCurrentDate(new Date(currentDate.getFullYear(), month));
  };

  const handleDayClick = (day) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(selected);
    const formattedDate = selected.toISOString().split("T")[0];
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handleClickOutside = (e) => {
    if (pickerRef.current && !pickerRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 100; i <= currentYear; i++) {
    years.push(i);
  }

  const days = [];
  const firstDay = getFirstDayOfMonth(currentDate);
  const daysCount = daysInMonth(currentDate);

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysCount; i++) {
    days.push(i);
  }

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    if (!day || !selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const formattedValue = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="date-picker-wrapper" ref={pickerRef}>
      <label className="date-picker-label">
        {label} {required && "*"}
      </label>
      <div className="date-picker-input-group">
        <button
          type="button"
          className="date-picker-input"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="date-picker-icon">📅</span>
          <span className="date-picker-text">
            {formattedValue || "Select date of birth"}
          </span>
          <span className="date-picker-arrow">{isOpen ? "▼" : "▶"}</span>
        </button>
        <input type="hidden" value={value || ""} required={required} />
      </div>

      {isOpen && (
        <div className="date-picker-calendar">
          <div className="calendar-header">
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handlePrevMonth}
            >
              ◀
            </button>

            <div className="calendar-month-year">
              <select
                value={currentDate.getMonth()}
                onChange={handleMonthChange}
                className="calendar-select"
              >
                {monthNames.map((month, idx) => (
                  <option key={idx} value={idx}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={currentDate.getFullYear()}
                onChange={handleYearChange}
                className="calendar-select"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handleNextMonth}
            >
              ▶
            </button>
          </div>

          <div className="calendar-weekdays">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="calendar-days">
            {days.map((day, idx) => (
              <button
                key={idx}
                type="button"
                className={`calendar-day ${day ? "active" : "empty"} ${
                  isSelected(day) ? "selected" : ""
                } ${isToday(day) ? "today" : ""}`}
                onClick={() => day && handleDayClick(day)}
                disabled={!day}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="calendar-footer">
            <button
              type="button"
              className="calendar-close-btn"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
