import moment from 'moment'

export function isValidNumberInput(str) {
  return !/\D/.test(str) || str === '' 
}

export function isValidHourInput(str) {
  let rule = /^[0-9aAmMpP: ]+$/
  return (str.match(rule) || str === '') && str.length < 9
}

export function classnames() {
  let classNames = ''
  for (let i = 0; i < arguments.length; i ++) {
    let className = ''
    if (arguments[i] && typeof arguments[i] === 'object') {
      let argObj = arguments[i]
      if (argObj[Object.keys(argObj)[0]]) {
        className = Object.keys(argObj)[0]
      } 
    } else if (arguments[i]) {
      className = arguments[i]
    }
    classNames += classNames !== '' && className ? ' ' + className : className
  }
  return classNames
}

/*
  if new element's id existed, update to the array 
  other wise, add the new element to the array
*/
export function updateArrayOfObject(originArray, newEl) {
  let index = originArray.findIndex(el => el.id === newEl.id)
  let newArray = originArray.slice(0)
  
  if (index < 0) {
    newArray.push(newEl)
  } else {
    newArray[index] = newEl
  }
  return newArray
}

/**/
export function getAvailabilitesInDay(editingBlockDays, selectedDay) {
  let editingAvailsInDay = []

  editingBlockDays.forEach(editingAvail => {
    let startAtObject = new Date(editingAvail.startAt)
    let endAtObject = new Date(editingAvail.endAt)
    if (parseInt(editingAvail.weekDay, 10) === selectedDay.day 
      && startAtObject.setHours(0,0,0,0) <= selectedDay.timeStamp
      && endAtObject.setHours(0,0,0,0) >= selectedDay.timeStamp
    ) {
      editingAvailsInDay.push(editingAvail)
    }
  })
  return editingAvailsInDay
}

// sort cards by lastest time then add time info to the list
export function cardsParser(cards) {
  // sort cards by lastest time
  let newCards = cards.map(item => {
    let date = item.date;
    let timeObj = new Date(date.year, date.month, date.day);
    date.hour = date.hour ? date.hour : 0
    // calculate time to sort cards by latest time
    item.time = timeObj.getTime() + (24 - date.hour) * 3600000;
    if (date.hour < 12) {
      item.date.dayPart = 'morning'
    } else if (date.hour < 17) {
      item.date.dayPart = 'afternoon'
    } else if (date.hour < 20) {
      item.date.dayPart = 'evening'
    } else {
      item.date.dayPart = 'beforeBed'
    }
    return item;
  })

  newCards.sort((a,b) => 
    (a.time < b.time) ? 1 : ((b.time < a.time) ? -1 : 0)
  )

  // add time info to the list
  let tempDate = ''
  let newList = newCards.slice();
  let newIndex = 0;

  newCards.map((card, index) => {
    let cardMonth = card.date.month
    let cardDay = card.date.day
    let cardHour = card.date.hour
    cardMonth = cardMonth > 9 ? cardMonth.toString() : "0" + cardMonth.toString()
    cardDay = cardDay > 9 ? cardDay.toString() : "0" + cardDay.toString()

    let cardDate = moment(card.date.year.toString() + "-" + cardMonth + "-" + cardDay)

    let firstActiveCardFinded = false

    // if time is today
    if (cardDate.format('L') === moment().format('L')) { 
      // if the first card of today
      if (tempDate !== card.date.dayPart) {
        if (card.status !== 'inProgress') {
          newList.splice(newIndex, 0, {cardDate: cardDate, hour: cardHour, status: 'processed'})
          newIndex += 1
        } else {
          tempDate = card.date.dayPart
          newList.splice(newIndex, 0, {cardDate: cardDate, hour: cardHour, status: ''})
          newIndex += 1
        } 
        if (!firstActiveCardFinded && card.status === 'inProgress') {
          card.isFirstActiveCard = true
          firstActiveCardFinded = true
        } else {
          card.isFirstActiveCard = false
        }
      } else {
        firstActiveCardFinded = false
      }
    // else not today
    } else { 
      // if the first card of days after today
      if (tempDate !== cardDate.format('L')) { 
        if (card.status !== 'inProgress') {
          newList.splice(newIndex, 0, {cardDate: cardDate, hour: cardHour, status: 'processed'})
          newIndex += 1
        } else {
          tempDate = cardDate.format('L')
          newList.splice(newIndex, 0, {cardDate: cardDate, hour: cardHour, status: ''})
          newIndex += 1
        }
        if (!firstActiveCardFinded && card.status === 'inProgress') {
          card.isFirstActiveCard = true
          firstActiveCardFinded = true
        } else {
          card.isFirstActiveCard = false
        }
      } else {
        firstActiveCardFinded = false
      }
    }

    newIndex += 1
    return card
  })

  return newList;
}

// page scroll
// src: https://pawelgrzybek.com/page-scroll-in-vanilla-javascript/
// Browser support:

// Chrome >= 24
// Firefox >= 23
// IE >= 10
// Opera >= 15
// Safari >= 8 (on previous versions it breaks on 'now' in window.performance)
// Android 4.4
// Firefox >= 23
// IE Mobile >= 10
// Opera Mobile >= 15
// Safari iOS >= 9
// Chrome for Android >= 35

/**
 *
 * @param {(number|HTMLElement)} destination - Destination to scroll to (DOM element or number)
 * @param {number} duration - Duration of scrolling animation
 * @param {string} easing - Timing function name (Allowed values: 'linear', 'easeInQuad', 'easeOutQuad', 'easeInOutQuad', 'easeInCubic', 'easeOutCubic', 'easeInOutCubic', 'easeInQuart', 'easeOutQuart', 'easeInOutQuart', 'easeInQuint', 'easeOutQuint', 'easeInOutQuint')
 * @param {function} callback - Optional callback invoked after animation
 */
export function scrollIt(destination, duration = 200, easing = 'linear', firstActiveCardProcessed=false, callback) {

  // Predefine list of available timing functions
  // If you need more, tween js is full of great examples
  // https://github.com/tweenjs/tween.js/blob/master/src/Tween.js#L421-L737
  const easings = {
    linear(t) {
      return t;
    },
    easeInQuad(t) {
      return t * t;
    },
    easeOutQuad(t) {
      return t * (2 - t);
    },
    easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    easeInCubic(t) {
      return t * t * t;
    },
    easeOutCubic(t) {
      return (--t) * t * t + 1;
    },
    easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },
    easeInQuart(t) {
      return t * t * t * t;
    },
    easeOutQuart(t) {
      return 1 - (--t) * t * t * t;
    },
    easeInOutQuart(t) {
      return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
    },
    easeInQuint(t) {
      return t * t * t * t * t;
    },
    easeOutQuint(t) {
      return 1 + (--t) * t * t * t * t;
    },
    easeInOutQuint(t) {
      return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
    }
  };


  // Store initial position of a window and time
  // If performance is not available in your browser
  // It will fallback to new Date().getTime() - thanks IE < 10
  const start = window.pageYOffset;
  const startTime = 'now' in window.performance ? performance.now() : new Date().getTime();
  // const startTime = typeof(window.performance['now']) == 'function' ? performance.now() : new Date().getTime();


  // Take height of window and document to sesolve max scrollable value
  // Prevent requestAnimationFrame() from scrolling below maximum scollable value
  // Resolve destination type (node or number)
  const documentHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
  const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;
  const destinationOffset = typeof destination === 'number' ? destination : destination.offsetTop;
  let destinationOffsetToScroll = Math.round(documentHeight - destinationOffset < windowHeight ? documentHeight - windowHeight : destinationOffset);

  destinationOffsetToScroll = firstActiveCardProcessed ? destinationOffsetToScroll - 88 : destinationOffsetToScroll - 12

  // If requestAnimationFrame is not supported
  // Move window to destination position and trigger callback function
  if ('requestAnimationFrame' in window === false) {
    window.scroll(0, destinationOffsetToScroll);
    if (callback) {
      callback();
    }
    return;
  }


  // function resolves position of a window and moves to exact amount of pixels
  // Resolved by calculating delta and timing function choosen by user
  function scroll() {
    const now = 'now' in window.performance ? performance.now() : new Date().getTime();
    const time = Math.min(1, ((now - startTime) / duration));
    const timeFunction = easings[easing](time);
    window.scroll(0, Math.ceil((timeFunction * (destinationOffsetToScroll - start)) + start));

    // Stop requesting animation when window reached its destination
    // And run a callback function
    if (window.pageYOffset === destinationOffsetToScroll) {
      if (callback) {
        callback();
      }
      return;
    }

    // If window still needs to scroll to reach destination
    // Request another scroll invokation
    requestAnimationFrame(scroll);
  }


  // Invoke scroll and sequential requestAnimationFrame
  scroll();
}
