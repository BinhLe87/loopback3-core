let cal_full_days_labels = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
let cal_months_labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
let cal_months_labels_short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
let cal_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/*
  input: 2018, 3, 27
  output: Tuesday, 27/03.2018
*/
export function getFullDate(year, month, date) {
  let selected_date_obj = new Date(year, month, date)
  let selected_day = selected_date_obj.getDay()

  let fullDate = ''
  fullDate += cal_full_days_labels[selected_day] 
  fullDate += ', ' + date + '/' + (month + 1)
  fullDate += '/' + year

  return fullDate
}

export function getViewDate(year, month, date) {
  let view_date = ''
  let view_month = ''

  let viewTimeObj = new Date(year, month, date)
  let day = viewTimeObj.getDay() !== 0 ? viewTimeObj.getDay(): 7

  let month_of_week_start = getDateFarFromDate(year, month, date, 0, 0, 1 - day, 0).month
  let month_of_week_end = getDateFarFromDate(year, month, date, 0, 0, 7 - day, 0).month

  if (month_of_week_start === month_of_week_end) {
    view_month += cal_months_labels[month]
  } else {
    view_month += cal_months_labels_short[month_of_week_start]
    view_month += ' - ' + cal_months_labels_short[month_of_week_end]
  }
  
  view_date += view_month + ' ' + year
  return view_date
}

export function isToday(year, month, date) {
  let now = new Date()
  return year === now.getFullYear() && month === now.getMonth() && date === now.getDate()
}

export function getDateFromTimeStamp(timeStamp) {
  let dateObj = new Date(timeStamp)

  return {
    year: dateObj.getFullYear(),
    month: dateObj.getMonth(),
    date: dateObj.getDate(),
    hour: dateObj.getHours(),
    minute: dateObj.getMinutes()
  }
}

export function getTimeFormated(hour, minute, format24) {
  let dayPart = ''
  minute = minute < 10 ? '0' + minute : minute
  if (!format24) {
    dayPart = hour > 11 ? 'pm' : 'am'
    hour = hour > 12 ? hour - 12 : hour
  } 
  return hour + ':' + minute + ' ' + dayPart
}

export function getTimeZoneInfo(tzOffset, tzName) {
  let tzOffsetString = ''
  let formatedTz = ''
  tzName = tzName.replace(/_/g, " ")
  if (Math.abs(tzOffset % 1) !== 0) {
    tzOffsetString = tzOffset <= 0 ? Math.ceil(tzOffset) : '+' + Math.floor(tzOffset)
    tzOffsetString = tzOffsetString + ':30) '
  } else {
    tzOffsetString = tzOffset <= 0 ? tzOffset + ':00) ' : '+' + tzOffset + ':00) '
  }
  formatedTz = '(GMT: ' + tzOffsetString + tzName
  return formatedTz
}

// check if has available day before viewing day
export function hasAvailableBefore(specificAvailables, year, month, date) {
  return specificAvailables.some(time =>
    (time.year < year)
      || (time.year === year && time.month < month)
      || (time.year === year && time.month === month && time.date < date)
  )
}

// check if has available day before viewing day
export function hasAvailableAfter(specificAvailables, year, month, date) {
  return specificAvailables.some(time =>
    (time.year > year)
      || (time.year === year && time.month > month)
      || (time.year === year && time.month === month && time.date > date)
  )
}

export function getAvailableLocalTimes(block, tzOffsetDiff) {
  let dateArray = block.time.split(' ')[0].split('-')
  let hourArray = block.time.split(' ')[1].split(':')
  
  let year = parseInt(dateArray[0], 10)
  let month = parseInt(dateArray[1], 10) - 1
  let date = parseInt(dateArray[2], 10)
  let hour = parseInt(hourArray[0], 10)
  let minute = parseInt(hourArray[1], 10)

  let currentTimeObject = new Date(year, month, date, hour, minute)
  let localTimeObject = new Date(currentTimeObject.getTime() + tzOffsetDiff*3600000)

  return {
    id: block.id,
    year: localTimeObject.getFullYear(),
    month: localTimeObject.getMonth(),
    date: localTimeObject.getDate(),
    hour: localTimeObject.getHours(),
    minute: localTimeObject.getMinutes()
  }
}

export function getUniqueDates(times) {
  if (!times) return
  let uniqueDates = []
  let tempDate = {
    year: 1970,
    month: 0,
    date: 0
  }

  times.forEach(time => {
    if (time.year !== tempDate.year || time.month !== tempDate.month || time.date !== tempDate.date) {
      tempDate = {
        year: time.year,
        month: time.month,
        date: time.date
      }
      uniqueDates.push(tempDate)
    } 
  })
  
  return uniqueDates
}

export function isAvailableDate(availableDates, year, month, date) {
  return availableDates.some(availableDate => 
    availableDate.year === year && availableDate.month === month && availableDate.date === date
  )
}

export function getDateFarFromDate(year, month, date, hour, minute, dayDistance, hourDistance) {
  let fromDateObj = new Date(year, month, date, hour, minute)
  let fromDateTimeStamp = fromDateObj.getTime()
  let targetDateTimeStamp = fromDateTimeStamp + dayDistance*24*60*60*1000 + hourDistance*60*60*1000
  let targetDateObj = new Date(targetDateTimeStamp)

  return {
    year: targetDateObj.getFullYear(),
    month: targetDateObj.getMonth(),
    date: targetDateObj.getDate(),
    hour: targetDateObj.getHours(),
    minute: targetDateObj.getMinutes()
  }
}

export function getEndDateTimeStampByOccurrence(beginTimeStamp, occurrences) {
  let beginTimeObject = new Date(beginTimeStamp)
  let fifteenthInBeginMonthObj = new Date(beginTimeObject.getFullYear(), beginTimeObject.getMonth(), 15)
  let fifteenthInEndDateMonthObj = new Date(fifteenthInBeginMonthObj.getTime() + occurrences*30*24*3600000)
  let endDateTimeObj = new Date(fifteenthInEndDateMonthObj.getFullYear(), fifteenthInEndDateMonthObj.getMonth(), 1)
  return endDateTimeObj.getTime()
}

export function checkValidTimeInputs(timeFrom, timeTo, willRemoveAvailId) {
  let result = ''

  if (timeFrom === '' && timeTo === '') {
    if (willRemoveAvailId === 0) {
      result = 'Time input can not be empty!'
    }
  } else {
    if ( (timeFrom !== '' && timeTo === '') || 
      (timeFrom === '' && timeTo !== '') ) {
      result = 'Time input can not be empty!'
    }
    if (dayTimeToTwentyFourFormat(timeFrom) >= dayTimeToTwentyFourFormat(timeTo)) {
      result = 'Time End must be later than Time Start!'
    }
    if ( (!timeFrom.includes('am') && !timeFrom.includes('pm')) 
        || (!timeTo.includes('am') && !timeTo.includes('pm')) 
        || (!timeFrom.includes(':') || !timeTo.includes(':')) 
        || (!/\d/.test(timeFrom) || !/\d/.test(timeFrom))
    ) {
      result = 'Time input is not correct!'
    }
  }
  return result
}

/*
  input: 1521618172845
  output: '2018-03-21'
*/
export function getDateStringFromStamp(timeStamp) {
  let date = new Date(timeStamp)
  let yyyy = date.getFullYear()
  let dd = date.getDate() 
  dd = dd < 10 ? '0' + dd : dd
  let mm = date.getMonth() + 1
  mm = mm < 10 ? '0' + mm : mm

  return yyyy + '-' + mm +  '-' + dd
}

/*
  input: 1521618172845
  output: '2018-03-21 00:00:00'
*/
export function getFullDateStringFromStamp(timeStamp) {
  let date = new Date(timeStamp)
  let yyyy = date.getFullYear()
  let dd = date.getDate() 
  dd = dd < 10 ? '0' + dd : dd
  let mm = date.getMonth() + 1
  mm = mm < 10 ? '0' + mm : mm

  return yyyy + '-' + mm +  '-' + dd + ' 00:00:00'
}

/*
  input: '2018-03-21' or '2018-03-21 08:00:00'
  output: 1521618172845
*/
export function getTimeStampFromString(timeString) {
  let date = new Date(timeString)
  return date.getTime()
}

/*
  input: '2018-03-21'
  output: true/false
*/
export function isTodayFromString(timeString) {
  let date = new Date(timeString)
  let today = new Date()
  return date.setHours(0,0,0,0) === today.setHours(0,0,0,0)
}

export function isInDateRange(dateRange, dayTimeStamp) {
  let today = new Date()
  let todayTime = today.setHours(0,0,0,0)
  let lastDateRange = todayTime + (dateRange)*24*3600000
  return dayTimeStamp >= todayTime && dayTimeStamp < lastDateRange
}

export function hourStringToHourNumber(hourString) {
  let hour = parseInt(hourString.split(':')[0], 10)
  let minute = parseInt(hourString.split(':')[1], 10) / 60
  return hour + minute
}

export function hourNumberToHourString(hourNumber) {
  let hourString = ''
  if (hourNumber % 1 === 0) {
    hourString = hourNumber + ":00"
  } else {
    hourString = Math.floor(hourNumber)
    hourString += ":"
    hourString += (hourNumber - Math.floor(hourNumber)) * 60
  }
  return hourString
}

export function hourStringTo24Format(hourString) {
  let result = ''
  if (hourString.includes('am')) {
    result = hourString.slice(0, -3)
  } else {
    hourString = hourString.slice(0, -3)
    let hourArr = hourString.split(':')
    let hour = parseInt(hourArr[0], 10) < 12 ? parseInt(hourArr[0], 10) + 12 : parseInt(hourArr[0], 10)
    result = hour + ':' + hourArr[1]
  }
  return result
}

/*
  output: Mar 26 - Apr 8 2018
*/
export function getDateRangeTitle(screenWidth, showTwoWeeks, viewDayTimeStamp) {
  let numberOfDaysShowed = 7
  let firstShowedDayObject = {}
  let lastShowedDayObject = {}
  
  if (screenWidth > 639) {
    numberOfDaysShowed = showTwoWeeks ? 14 : 35
  }

  let viewDayTimeObject = new Date(viewDayTimeStamp)
  let viewDay = viewDayTimeObject.getDay() !== 0 ? viewDayTimeObject.getDay() : 7
  
  firstShowedDayObject = new Date(viewDayTimeObject.getTime() - (viewDay - 1)*24*3600000)
  lastShowedDayObject = new Date(firstShowedDayObject.getTime() + (numberOfDaysShowed-1)*24*3600000)

  let firstShowedDayMonth = firstShowedDayObject.getMonth()
  let lastShowedDayMonth = lastShowedDayObject.getMonth()

  let dateRangeTitle = ''
  dateRangeTitle += cal_months_labels_short[firstShowedDayMonth] + ' '
  dateRangeTitle += firstShowedDayObject.getDate() + ' - '
  dateRangeTitle += cal_months_labels_short[lastShowedDayMonth] + ' '
  dateRangeTitle += lastShowedDayObject.getDate() + ', '
  dateRangeTitle += lastShowedDayObject.getFullYear() + ' '
  return dateRangeTitle
}

/*
  both of days is Monday/Tuesday...
*/
export function isSameWeekDay(day1, day2) {
  let day1Object = new Date(day1)
  let day2Object = new Date(day2)
  return (day1Object.getDay() === day2Object.getDay())
}

/*
  both of days in the same week
*/
export function isInTheSameWeek(timestamp1, timestamp2) {
  let day1Object = new Date(timestamp1)
  let day1Day = day1Object.getDay() !== 0 ? day1Object.getDay() : 7
  return (timestamp2 >= timestamp1 - (day1Day - 1)*24*3600000 && timestamp2 <= timestamp1 + (7 - day1Day)*24*3600000)
}

/*
  input: '08:00:00'
  output: '8:00 am'
*/

export function twentyFourToDayTimeFormat(timeString) {
  let timeArray = timeString.split(' ')
  let hour = parseInt(timeArray[0].split(':')[0], 10)
  let minute = parseInt(timeArray[0].split(':')[1], 10)

  let dayTime = hour < 12 ? 'am' : 'pm'
  hour = hour < 13 ? hour : hour - 12
  hour = hour > 9 ? hour: '0' + hour
  minute = minute > 9 ? minute : '0' + minute

  return hour + ':' + minute + ' ' + dayTime
}

/*
  input: '02:00 pm'
  output: '14:00:00'
*/
export function dayTimeToTwentyFourFormat(timeString) {
  let timeArray = timeString.split(' ')
  let hour = parseInt(timeArray[0].split(':')[0], 10)
  let minute = parseInt(timeArray[0].split(':')[1], 10)

  hour = timeString.includes('am') || hour === 12 ? hour : hour + 12
  hour = hour > 9 ? hour.toString() : '0' + hour
  minute = minute > 9 ? minute.toString() : '0' + minute
  
  return hour + ':' + minute + ':00'
}

/*
  input: {year: 2018, month: 3, date: 20, hour: 8, minute: 0}
  output: timeStamp in minutes
*/
export function getNumberOfMinute(object) {
  let timeObject = new Date(object.year, object.month, object.date, object.hour, object.minute, 0, 0)
  return timeObject.getTime() / 60000
}

/*
  input: (2018, 3)
  ouput: 30
*/
export function getNumberOfDaysOfMonth(year, month) {
  let monthLength = cal_days_in_month[month]

  // compensate for leap year
  if (month === 1) { // February only!
    if((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0){
      monthLength = 29
    }
  }

  return monthLength
}

/**/
export function isDayBeforeCurrentWeek(dayTimeStamp) {
  let today = new Date()
  let todayDay = today.getDay() !== 0 ? today.getDay() : 7
  let firstDayOfCurrentWeekObject = new Date(today.getTime() - (todayDay - 1)*24*3600000)
  return dayTimeStamp < firstDayOfCurrentWeekObject.setHours(0,0,0,0)
}

/*
  example:
  today: June, 05, 2018
  input: 2018-06-25 00:00:00
  output: 20
*/
export function getNumberOfDaysFromTime(time) {
  let today = new Date()
  let targetTimeObject = new Date(time)
  let numberOfDays = (targetTimeObject.getTime() - today.getTime()) / 24 / 3600000
  numberOfDays = numberOfDays > 0 ? numberOfDays : 0
  return Math.ceil(numberOfDays)
}

/*
  input: timestamp(2018-06-11)
  ouput: second (Monday)
*/
export function getWeekDayOrderInMonth(timeStamp) {
  let dayObject = new Date(timeStamp)
  let dayDate = dayObject.getDate()
  let lastDayInMonth = getNumberOfDaysOfMonth(dayObject.getFullYear(), dayObject.getMonth())
  let order = ""

  if (dayDate < 8) {
    order = "first"
  } else if (dayDate < 15) {
    order = "second"
  } else if (dayDate < 22) {
    order = "third"
  } else if (dayDate < lastDayInMonth - 6) {
    order = "fourth"
  } else {
    order = "last"
  }
  
  return order
}

/*
  in case the day which is checked is sunday, return 7
*/
export function getCaculatedDay(day) {
  return day !== 0 ? day : 7
}

export function getWeekDayFromData(data) {
  let dateObject = new Date(data)
  return dateObject.getDay() !== 0 ? dateObject.getDay() : 7
}
