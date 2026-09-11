export function getBotResponse(message, context) {
  const text = message.toLowerCase().trim();

  const {
    sensors,
    history = [],
    studentsPresent,
    teachersPresent,
    attendance = [],
    connected,
    mode,
    secondsSinceUpdate,
  } = context;

  // Greeting
  if (
    text.includes('hello') ||
    text.includes('hi') ||
    text.includes('hey')
  ) {
    return {
      text: 'Hello! 👋 I am the Smart Campus Assistant. You can ask me anything about this campus.'
    };
  }

  // Project
  if (
    text.includes('what is this project') ||
    text.includes('about this project') ||
    text.includes('smart campus')
  ) {
    return {
      text: 'This is a Smart Campus Digital Twin system. It monitors classroom environmental conditions and attendance using IoT sensors connected to an ESP32. The data is visualized in real time through the Digital Twin dashboard.'
    };
  }

  // Digital Twin
  if (
    text.includes('digital twin') ||
    text.includes('what is digital twin')
  ) {
    return {
      text: 'A Digital Twin is a virtual representation of a physical environment. In this project, the campus and classrooms are represented digitally while sensor data provides information about real-world conditions.'
    };
  }

  if (
    text.includes('what can i monitor') ||
    text.includes('what can i monitor from this dashboard')
  ) {
    return {
      text:
        'The dashboard allows you to monitor classroom temperature, humidity, pollution index, air quality, attendance, occupancy, ESP32 connectivity, and historical environmental trends.'
    };
  }

  // CLASSROOM

  if (
    text.includes('classroom 101') ||
    text.includes('classroom status') ||
    text.includes('classroom condition')
  ) {
    return {
      text:
        `Classroom 101 is the currently monitored live classroom. It has ${studentsPresent} students and ${teachersPresent} teachers detected, with a total occupancy of ${totalPresent} people.`
    };
  }

  if (
    text.includes('occupied') ||
    text.includes('occupancy') ||
    text.includes('is anyone present')
  ) {
    if (totalPresent > 0) {
      return {
        text:
          `Yes. The classroom is currently occupied with ${totalPresent} people detected.`
      };
    }

    return {
      text:
        'The classroom is currently showing no detected occupants.'
    };
  }

  // ESP32
  if (
    text.includes('esp32') ||
    text.includes('what is esp32')
  ) {
    return {
      text: 'ESP32 is the main IoT controller used in this project. It reads sensor data and sends the information to the Smart Campus Digital Twin dashboard.'
    };
  }

  // Temperature
  if (
    text.includes('temperature') ||
    text.includes('how hot') ||
    text.includes('how warm')
  ) {
    if (sensors?.temperature !== undefined) {
      return {
        text: `The current temperature in Classroom 101 is ${Number(
          sensors.temperature
        ).toFixed(1)} °C.`
      };
    }

    return {
      text: 'Temperature data is currently unavailable.'
    };
  }

  // Humidity
  if (text.includes('humidity')) {
    if (sensors?.humidity !== undefined) {
      return {
        text: `The current humidity in Classroom 101 is ${Number(
          sensors.humidity
        ).toFixed(1)}%.`
      };
    }

    return {
      text: 'Humidity data is currently unavailable.'
    };
  }

  // Air Quality
  if (
    text.includes('air quality') ||
    text.includes('pollution') ||
    text.includes('air pollution') ||
    text.includes('mq135')
  ) {
    const pollution =
      sensors?.pollution ??
      sensors?.mq135;

    if (pollution !== undefined) {
      return {
        text: `The current Pollution Index is ${Number(
          pollution
        ).toFixed(0)}. This value is used by the system to determine the classroom air quality.`
      };
    }

    return {
      text: 'Air quality data is currently unavailable.'
    };
  }

  // Students
  if (
    text.includes('students') ||
    text.includes('student present') ||
    text.includes('how many students')
  ) {
    return {
      text: `There are currently ${studentsPresent ?? 0} students present in the monitored classroom.`
    };
  }

  // Teachers
  if (
    text.includes('teachers') ||
    text.includes('teacher present')
  ) {
    return {
      text: `There are currently ${teachersPresent ?? 0} teachers present.`
    };
  }

  // Attendance
  if (text.includes('attendance')) {
    return {
      text: `The system monitors attendance using RFID-based identification. Currently, ${studentsPresent ?? 0} students and ${teachersPresent ?? 0} teachers are detected.`
    };
  }


  // LAST ATTENDANCE ACTIVITY

  if (
    text.includes('last person') ||
    text.includes('last detected') ||
    text.includes('latest attendance') ||
    text.includes('last attendance')
  ) {
    if (attendance.length > 0) {

      const latest = attendance[0];

      return {
        text:
          `The latest attendance activity is ${latest.name || 'an unidentified person'}${latest.role ? ` (${latest.role})` : ''}.`
      };
    }

    return {
      text:
        'There is no recent attendance activity available.'
    };
  }

  

  // LIVE DATA
  if (
    text.includes('live data') ||
    text.includes('live sensor') ||
    text.includes('real time') ||
    text.includes('realtime')
  ) {
    return {
      text: connected
        ? 'Yes. The dashboard is currently connected to the ESP32 and receiving live sensor data.'
        : 'Live sensor data is currently unavailable because the ESP32 is not connected.'
    };
  }

  // LAST UPDATE
  if (
    text.includes('last update') ||
    text.includes('updated') ||
    text.includes('when was the last')
  ) {
    if (
      secondsSinceUpdate !== undefined &&
      secondsSinceUpdate !== null
    ) {
      return {
        text:
          `The dashboard received its latest telemetry approximately ${secondsSinceUpdate} seconds ago.`
      };
    }

    return {
      text:
        'The latest sensor update time is currently unavailable.'
    };
  }


  // Connection
  if (
    text.includes('connected') ||
    text.includes('connection') ||
    text.includes('device status') ||
    text.includes('esp status')
  ) {
    return {
      text: connected
        ? 'The ESP32 device is currently connected and telemetry data is being received.'
        : 'The ESP32 is currently offline or not connected. You can check the ESP32 settings and network connection.'
    };
  }


  // Sensors
  if (
    text.includes('sensor') ||
    text.includes('sensors used')
  ) {
    return {
      text: 'The current system monitors temperature, humidity, pollution/air quality, and attendance-related information. ESP32 acts as the IoT controller connecting the physical sensors to the dashboard.'
    };
  }


  // ENVIRONMENTAL CONDITION
  if (
    text.includes('classroom comfortable') ||
    text.includes('comfortable')
  ) {

    if (
      !Number.isNaN(temperature) &&
      !Number.isNaN(humidity)
    ) {

      if (
        temperature > 30 ||
        humidity > 70
      ) {
        return {
          text:
            `The classroom may be less comfortable at the moment. The temperature is ${temperature.toFixed(1)} °C and humidity is ${humidity.toFixed(1)}%.`
        };
      }

      return {
        text:
          `The current environmental readings appear reasonably comfortable, with temperature at ${temperature.toFixed(1)} °C and humidity at ${humidity.toFixed(1)}%.`
      };
    }

    return {
      text:
        'I need current temperature and humidity data to evaluate classroom comfort.'
    };
  }


  // Help
  if (
    text.includes('help') ||
    text.includes('what can you do')
  ) {
    return {
      text: 'You can ask me about temperature, humidity, air quality, pollution, attendance, students, teachers, ESP32 connection, Digital Twin technology, sensors, Classroom 101, Demo Mode, and Live Mode.'
    };
  }

  // Default
  return {
    text: "Sorry, I don't have an answer for that yet. Try asking about temperature, humidity, air quality, attendance, sensors, ESP32, Classroom 101, or the Smart Campus Digital Twin."
  };
}