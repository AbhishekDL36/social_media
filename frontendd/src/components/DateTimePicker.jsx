import { useState } from 'react'
import './DateTimePicker.css'

function DateTimePicker({ value, onChange, min }) {
  const [showPicker, setShowPicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState(value.split('T')[0] || '')
  const [selectedTime, setSelectedTime] = useState(value.split('T')[1]?.slice(0, 5) || '12:00')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const handleDateClick = (day) => {
    const year = currentMonth.getFullYear()
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0')
    const date = String(day).padStart(2, '0')
    const newDate = `${year}-${month}-${date}`
    setSelectedDate(newDate)
  }

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value)
  }

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      const dateTimeValue = `${selectedDate}T${selectedTime}:00`
      onChange(dateTimeValue)
      setShowPicker(false)
    } else {
      alert('Please select both date and time')
    }
  }

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const calendarDays = generateCalendarDays()
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const displayValue = value ? new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Select date & time'

  const minDate = min ? new Date(min).toISOString().split('T')[0] : null

  return (
    <div className="datetime-picker-wrapper">
      <button
        type="button"
        className="datetime-picker-button"
        onClick={() => setShowPicker(!showPicker)}
      >
        📅 {displayValue}
      </button>

      {showPicker && (
        <div className="datetime-picker-popup">
          <div className="datetime-picker-content">
            {/* Calendar Section */}
            <div className="picker-calendar">
              <div className="calendar-header">
                <button onClick={handlePrevMonth} className="nav-btn">←</button>
                <h3>{monthName}</h3>
                <button onClick={handleNextMonth} className="nav-btn">→</button>
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
                {calendarDays.map((day, idx) => (
                  <button
                    key={idx}
                    className={`calendar-day ${!day ? 'empty' : ''} ${
                      selectedDate === `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` ? 'selected' : ''
                    } ${minDate && day ? `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` < minDate ? 'disabled' : '' : ''}`}
                    onClick={() => day && handleDateClick(day)}
                    disabled={minDate && day ? `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` < minDate : false}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Section */}
            <div className="picker-time">
              <label>Time</label>
              <input
                type="time"
                value={selectedTime}
                onChange={handleTimeChange}
                className="time-input"
                step="60"
              />
              <small className="time-hint">Selected: {selectedTime}</small>
            </div>
          </div>

          <div className="datetime-picker-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setShowPicker(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-confirm"
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedTime}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DateTimePicker
