const trainingExamples = [
  { hours: 1, group: "Medium" },
  { hours: 2, group: "Medium" },
  { hours: 3, group: "Medium" },
  { hours: 4, group: "Medium" },
  { hours: 5, group: "Medium" },
  { hours: 5.5, group: "Medium" },
  { hours: 6, group: "Average" },
  { hours: 6.5, group: "Average" },
  { hours: 7, group: "Average" },
  { hours: 7.5, group: "Average" },
  { hours: 8, group: "Average" },
  { hours: 8.5, group: "Average" },
  { hours: 9, group: "Topper" },
  { hours: 9.5, group: "Topper" },
  { hours: 10, group: "Topper" },
  { hours: 11, group: "Topper" },
  { hours: 12, group: "Topper" },
  { hours: 14, group: "Topper" },
];
const groupOrder = ["Topper", "Average", "Medium"];
const groupRows = { Topper: 84, Average: 170, Medium: 256 };
const chartLeft = 100;
const chartWidth = 620;

const form = document.querySelector("#prediction-form");
const nameInput = document.querySelector("#student-name");
const hoursInput = document.querySelector("#study-hours");
const formError = document.querySelector("#form-error");
const resultPlaceholder = document.querySelector("#result-placeholder");
const resultContent = document.querySelector("#result-content");
const studentGreeting = document.querySelector("#student-greeting");
const resultCategory = document.querySelector("#result-category");
const resultDetail = document.querySelector("#result-detail");
const resultHours = document.querySelector("#result-hours");
const samplePoints = document.querySelector("#sample-points");
const studentMarker = document.querySelector("#student-marker");
const graphCaption = document.querySelector("#graph-caption");

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attributes).forEach(([attribute, value]) => {
    element.setAttribute(attribute, value);
  });
  return element;
}

function drawTrainingExamples() {
  const groupOffsets = { Topper: 0, Average: 0, Medium: 0 };
  trainingExamples.forEach((example) => {
    const index = groupOffsets[example.group]++;
    const offset = (index - 2.5) * 4;
    const point = createSvgElement("circle", {
      cx: chartLeft + (example.hours / 40) * chartWidth,
      cy: groupRows[example.group] + offset,
      r: 5,
      class: "sample-point",
    });
    point.append(createSvgElement("title"));
    point.firstElementChild.textContent = `${example.hours} hours per week — ${example.group} example`;
    samplePoints.append(point);
  });
}

function predictGroup(hours) {
  const neighbors = trainingExamples
    .map((example) => ({ ...example, distance: Math.abs(example.hours - hours) }))
    .sort((first, second) => first.distance - second.distance)
    .slice(0, 3);

  const votes = new Map(groupOrder.map((group) => [group, { count: 0, totalDistance: 0 }]));
  neighbors.forEach(({ group, distance }) => {
    const vote = votes.get(group);
    vote.count += 1;
    vote.totalDistance += distance;
  });

  const winningGroup = groupOrder
    .filter((group) => votes.get(group).count > 0)
    .sort((first, second) => {
      const voteDifference = votes.get(second).count - votes.get(first).count;
      if (voteDifference !== 0) return voteDifference;
      return votes.get(first).totalDistance - votes.get(second).totalDistance;
    })[0];

  return { group: winningGroup, votes: votes.get(winningGroup).count };
}

function displayPrediction(hours) {
  const { group, votes } = predictGroup(hours);
  const name = nameInput.value.trim();
  const markerX = chartLeft + (hours / 40) * chartWidth;
  const markerY = groupRows[group];
  const labelAnchor = markerX > 640 ? "end" : "start";
  const labelX = markerX > 640 ? markerX - 12 : markerX + 12;

  resultPlaceholder.hidden = true;
  resultContent.hidden = false;
  studentGreeting.textContent = name ? `Estimate for ${name}` : "Your estimate";
  resultCategory.textContent = group;
  resultCategory.className = `result-category category-${group.toLowerCase()}`;
  resultDetail.textContent = `${votes} of the 3 closest sample students were grouped as ${group.toLowerCase()}.`;
  resultHours.textContent = `${hours} ${hours === 1 ? "hour" : "hours"}`;

  const guide = createSvgElement("line", {
    x1: markerX,
    y1: 45,
    x2: markerX,
    y2: 295,
    class: "student-guide",
  });
  const halo = createSvgElement("circle", {
    cx: markerX,
    cy: markerY,
    r: 12,
    class: "student-point-halo",
  });
  const point = createSvgElement("circle", {
    cx: markerX,
    cy: markerY,
    r: 6,
    class: "student-point",
  });
  const title = createSvgElement("title");
  title.textContent = `${hours} hours per week — estimated group: ${group}`;
  point.append(title);

  const label = createSvgElement("text", {
    x: labelX,
    y: markerY - 13,
    "text-anchor": labelAnchor,
    class: "student-marker-label",
  });
  label.textContent = name ? `${name.toUpperCase()} · YOU` : "YOU";
  studentMarker.replaceChildren(guide, halo, point, label);
  graphCaption.textContent = `Your ${hours}-hour result is shown in the ${group.toLowerCase()} row.`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formError.textContent = "";
  hoursInput.removeAttribute("aria-invalid");

  const rawHours = hoursInput.value.trim();
  const hours = Number(rawHours);
  if (!rawHours || !Number.isFinite(hours) || hours < 0 || hours > 40) {
    formError.textContent = "Enter a number of weekly study hours from 0 to 40.";
    hoursInput.setAttribute("aria-invalid", "true");
    hoursInput.focus();
    return;
  }

  displayPrediction(hours);
});

hoursInput.addEventListener("input", () => {
  formError.textContent = "";
  hoursInput.removeAttribute("aria-invalid");
});

document.querySelector("#sample-button").addEventListener("click", () => {
  hoursInput.value = "8";
  form.requestSubmit();
});

drawTrainingExamples();
