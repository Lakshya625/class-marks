const STORAGE_KEY = 'studentRecords';
const TOTAL_MARKS = 500;
const TEACHER_PASSWORD = 'ABC Public School';

function normalizeStudent(student) {
  if (!student) return null;
  const name = student.name ? String(student.name).trim() : '';
  const rawPercentage = Number(student.percentage);
  const rawMarks = Number(student.marks);
  let percentage = Number.isFinite(rawPercentage) ? rawPercentage : null;

  if (percentage === null && Number.isFinite(rawMarks)) {
    percentage = (rawMarks / TOTAL_MARKS) * 100;
  }

  if (!name || percentage === null || Number.isNaN(percentage)) {
    return null;
  }

  return { name, percentage };
}

function getStoredStudents() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeStudent)
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

function saveStudents(students) {
  const cleaned = students
    .map(normalizeStudent)
    .filter(Boolean);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
}

function formatPercentage(value) {
  const formatted = Number(value.toFixed(1));
  return `${formatted}%`;
}

function getTopper(students) {
  if (!students || students.length === 0) return null;
  return students.reduce((topper, student) => {
    return student.percentage > topper.percentage ? student : topper;
  }, students[0]);
}

function renderTopper(elementId, students) {
  const topperBox = document.getElementById(elementId);
  if (!topperBox) return;
  const topper = getTopper(students);
  topperBox.textContent = topper
    ? `Topper: ${topper.name} (${formatPercentage(topper.percentage)})`
    : 'Topper: no students yet';
}

function renderList(elementId, students, options = {}) {
  const list = document.getElementById(elementId);
  if (!list) return;
  list.innerHTML = '';

  if (students.length === 0) {
    list.innerHTML = '<li class="empty">No students stored yet.</li>';
    return;
  }

  students.forEach((student, index) => {
    const item = document.createElement('li');
    const textSpan = document.createElement('span');
    textSpan.textContent = `${student.name} — ${formatPercentage(student.percentage)}`;
    item.appendChild(textSpan);

    if (options.showDelete) {
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'delete-button';
      deleteButton.textContent = 'Delete';
      deleteButton.dataset.index = index;
      item.appendChild(deleteButton);
    }

    list.appendChild(item);
  });
}

function removeStudent(index) {
  const students = getStoredStudents();
  students.splice(index, 1);
  saveStudents(students);
  renderList('student-list', students, { showDelete: true });
  renderList('all-students', students);
}

function setMessage(id, text, isError = false) {
  const message = document.getElementById(id);
  if (!message) return;
  message.textContent = text;
  message.classList.toggle('error', isError);
}

function initTeacherPage() {
  const nameInput = document.getElementById('student-name');
  const marksInput = document.getElementById('student-marks');
  const addButton = document.getElementById('add-student');
  const list = document.getElementById('student-list');

  addButton.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const marksValue = marksInput.value.trim();
    const marks = Number(marksValue);

    if (!name) {
      setMessage('teacher-message', 'Please enter a student full name.', true);
      return;
    }

    const nameParts = name.split(/\s+/).filter(Boolean);
    if (nameParts.length < 2) {
      setMessage('teacher-message', 'Please enter the student full name (first and last name).', true);
      return;
    }

    if (marksValue === '' || Number.isNaN(marks) || marks < 0 || marks > TOTAL_MARKS) {
      setMessage('teacher-message', `Please enter a number between 0 and ${TOTAL_MARKS}.`, true);
      return;
    }

    const students = getStoredStudents();
    const duplicate = students.some((student) => student.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      setMessage('teacher-message', 'A student with that full name already exists. Try adding class and roll number for students with the same name.', true);
      return;
    }

    const percentage = (marks / TOTAL_MARKS) * 100;
    students.push({ name, percentage });
    saveStudents(students);
    renderList('student-list', students, { showDelete: true });

    nameInput.value = '';
    marksInput.value = '';
    setMessage('teacher-message', 'Student saved successfully.');

    const originalText = addButton.textContent;
    addButton.textContent = '✓';
    addButton.disabled = true;

    setTimeout(() => {
      addButton.textContent = originalText;
      addButton.disabled = false;
    }, 2000);
  });

  if (list) {
    list.addEventListener('click', (event) => {
      const button = event.target.closest('.delete-button');
      if (!button) return;
      const index = Number(button.dataset.index);
      if (!Number.isNaN(index)) {
        removeStudent(index);
      }
    });
  }

  renderList('student-list', getStoredStudents(), { showDelete: true });
}

function initStudentPage() {
  const lookupInput = document.getElementById('lookup-name');
  const resultBox = document.getElementById('student-result');
  const lookupButton = document.getElementById('lookup-button');

  lookupButton.addEventListener('click', () => {
    const searchName = lookupInput.value.trim().toLowerCase();
    const students = getStoredStudents();

    if (!searchName) {
      resultBox.textContent = 'Please enter a student name to search.';
      return;
    }

    const matched = students.filter((student) => student.name.toLowerCase() === searchName);
    if (matched.length === 0) {
      resultBox.textContent = 'No student found with that name.';
      return;
    }

    resultBox.innerHTML = matched
      .map((student) => `<strong>${student.name}</strong>: ${formatPercentage(student.percentage)}`)
      .join('<br>');
  });

  const allStudentsList = document.getElementById('all-students');
  const students = getStoredStudents();
  renderList('all-students', students, { showDelete: true });
  renderTopper('topper-box', students);

  if (allStudentsList) {
    allStudentsList.addEventListener('click', (event) => {
      const button = event.target.closest('.delete-button');
      if (!button) return;
      const index = Number(button.dataset.index);
      if (!Number.isNaN(index)) {
        removeStudent(index);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const studentBtn = document.getElementById('student');
  const teacherBtn = document.getElementById('teacher');

  if (studentBtn) {
    studentBtn.addEventListener('click', () => {
      window.location.href = 'student.html';
    });
  }

  if (teacherBtn) {
    teacherBtn.addEventListener('click', () => {
      window.location.href = 'teacher-login.html';
    });
  }

  if (document.body.classList.contains('teacher-page') && window.location.pathname.endsWith('teacher.html')) {
    initTeacherPage();
  }

  if (document.body.classList.contains('student-page')) {
    initStudentPage();
  }

  if (document.body.classList.contains('teacher-page') && window.location.pathname.endsWith('teacher-login.html')) {
    const loginButton = document.getElementById('teacher-login');
    const passwordInput = document.getElementById('teacher-password');
    const loginMessage = document.getElementById('login-message');

    if (loginButton && passwordInput && loginMessage) {
      loginButton.addEventListener('click', () => {
        const enteredPassword = passwordInput.value.trim();
        if (enteredPassword === TEACHER_PASSWORD) {
          window.location.href = 'teacher.html';
        } else {
          loginMessage.textContent = 'Incorrect password. Please try again.';
          loginMessage.classList.add('error');
        }
      });
    }
  }

  document.body.addEventListener('click', (event) => {
    const deleteButton = event.target.closest('.delete-button');
    if (!deleteButton) return;
    const index = Number(deleteButton.dataset.index);
    if (!Number.isNaN(index)) {
      removeStudent(index);
    }
  });
});
