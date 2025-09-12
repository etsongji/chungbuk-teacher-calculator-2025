// 전역 변수
let leaves = [];
let previousSchools = [];
let currentTransferDate = null;
let currentRegion = null;
let currentSubRegion = null;

// DOM 요소들
let currentRegionSelect, currentCheongjuSubRegion, currentCheongjuType, currentTransferDateInput;
let addPreviousSchoolBtn, previousSchoolModal, schoolModalCloseBtn, schoolModalCancelBtn, schoolModalSaveBtn;
let addLeaveBtn, leaveModal, modalCloseBtn, modalCancelBtn, modalSaveBtn;
let previousSchoolForm, previousSchoolsList, leaveForm, leaveList, regionInfo;
let selectedRegionText, regionalLimitText, serviceSummary, regionalServiceSummary;
let currentServiceEl, totalRegionalServiceEl, schoolExpiryEl, regionalExpiryEl;
let schoolRemainingEl, regionalRemainingEl, leaveSummaryEl, leaveSummaryContentEl;

// 지역 설정 (2025년 개정 규정)
const regionalSettings = {
    'chungju': { name: '충주시', regionalTerm: 15, schoolTerm: 5, notes: '통산 15년, 실거주 7년 이상시 예외 적용 가능' },
    'jecheon': { name: '제천시', regionalTerm: 15, schoolTerm: 5, notes: '통산 15년, 실거주 7년 이상시 예외 적용 가능' },
    'cheongju': { name: '청주시', regionalTerm: 13, schoolTerm: 5, notes: '통산 13년, 동지역/읍면지역 구분' },
    'other': { name: '기타지역', regionalTerm: 8, schoolTerm: 5, notes: '일반 지역 근무연한 8년 적용' }
};

// 휴직 유형 설정 (2025년 개정 규정)
const leaveTypes = {
    'sick': { label: '질병휴직', includedInService: false, description: '일반 휴직으로 재직기간에서 제외' },
    'parental': { label: '육아휴직', includedInService: true, description: '재직기간으로 인정 (최신 규정 예외조항)' },
    'study': { label: '유학휴직', includedInService: false, description: '일반 휴직으로 재직기간에서 제외' },
    'military': { label: '병역휴직', includedInService: false, description: '일반 휴직으로 재직기간에서 제외' },
    'family_care': { label: '가족돌봄휴직', includedInService: false, description: '일반 휴직으로 재직기간에서 제외' },
    'union_official': { label: '노조전임자', includedInService: true, description: '재직기간으로 인정 (최신 규정 예외조항)' },
    'local_dispatch': { label: '지역내 행정기관 파견', includedInService: true, description: '소속교와 동일 지역 내 행정기관 파견시 재직기간 인정' },
    'other_dispatch': { label: '기타 파견', includedInService: false, description: '일반 파견으로 재직기간에서 제외' },
    'other': { label: '기타휴직', includedInService: false, description: '일반 휴직으로 재직기간에서 제외' }
};

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - 2025 Regulation Calculator with Previous Schools');
    
    // 약간의 지연을 두고 초기화 (DOM이 완전히 로드되도록)
    setTimeout(() => {
        initializeElements();
        setupEventListeners();
        setupDateInputs();
        updateResults();
    }, 100);
});

function initializeElements() {
    console.log('Initializing elements...');
    
    // 현임교 정보 DOM 요소들
    currentRegionSelect = document.getElementById('current-region-select');
    currentCheongjuSubRegion = document.getElementById('current-cheongju-sub-region');
    currentCheongjuType = document.getElementById('current-cheongju-type');
    currentTransferDateInput = document.getElementById('current-transfer-date');
    
    // 전임교 경력 관련 요소들
    addPreviousSchoolBtn = document.getElementById('add-previous-school-btn');
    previousSchoolModal = document.getElementById('previous-school-modal');
    schoolModalCloseBtn = document.getElementById('school-modal-close-btn');
    schoolModalCancelBtn = document.getElementById('school-modal-cancel-btn');
    schoolModalSaveBtn = document.getElementById('school-modal-save-btn');
    previousSchoolForm = document.getElementById('previous-school-form');
    previousSchoolsList = document.getElementById('previous-schools-list');
    
    // 휴직 정보 관련 요소들
    addLeaveBtn = document.getElementById('add-leave-btn');
    leaveModal = document.getElementById('leave-modal');
    modalCloseBtn = document.getElementById('modal-close-btn');
    modalCancelBtn = document.getElementById('modal-cancel-btn');
    modalSaveBtn = document.getElementById('modal-save-btn');
    leaveForm = document.getElementById('leave-form');
    leaveList = document.getElementById('leave-list');
    
    // 결과 표시 요소들
    regionInfo = document.getElementById('region-info');
    selectedRegionText = document.getElementById('selected-region-text');
    regionalLimitText = document.getElementById('regional-limit-text');
    serviceSummary = document.getElementById('service-summary');
    regionalServiceSummary = document.getElementById('regional-service-summary');
    currentServiceEl = document.getElementById('current-service');
    totalRegionalServiceEl = document.getElementById('total-regional-service');
    schoolExpiryEl = document.getElementById('school-expiry');
    regionalExpiryEl = document.getElementById('regional-expiry');
    schoolRemainingEl = document.getElementById('school-remaining');
    regionalRemainingEl = document.getElementById('regional-remaining');
    leaveSummaryEl = document.getElementById('leave-summary');
    leaveSummaryContentEl = document.getElementById('leave-summary-content');
    
    console.log('Elements initialized:', {
        currentRegionSelect: !!currentRegionSelect,
        addPreviousSchoolBtn: !!addPreviousSchoolBtn,
        addLeaveBtn: !!addLeaveBtn,
        currentServiceEl: !!currentServiceEl
    });
}

function setupDateInputs() {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    if (currentTransferDateInput) {
        currentTransferDateInput.setAttribute('max', todayString);
        
        // 기본값을 1년 전으로 설정 (테스트 편의를 위해)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const oneYearAgoString = oneYearAgo.toISOString().split('T')[0];
        currentTransferDateInput.value = oneYearAgoString;
        currentTransferDate = oneYearAgo;
        
        console.log('Date input initialized with default value:', oneYearAgoString);
    }
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // 현임교 지역 선택 이벤트
    if (currentRegionSelect) {
        currentRegionSelect.addEventListener('change', handleCurrentRegionChange);
        console.log('Current region select listener added');
    } else {
        console.error('currentRegionSelect not found');
    }
    
    // 청주시 세부지역 선택
    if (currentCheongjuType) {
        currentCheongjuType.addEventListener('change', handleCurrentCheongjuSubRegionChange);
    }

    // 현임교 전입일자 변경 이벤트
    if (currentTransferDateInput) {
        currentTransferDateInput.addEventListener('change', handleCurrentTransferDateChange);
        console.log('Current transfer date listener added');
    }

    // 전임교 경력 추가 버튼
    if (addPreviousSchoolBtn) {
        addPreviousSchoolBtn.addEventListener('click', handleAddPreviousSchoolClick);
        console.log('Previous school button listener added');
    } else {
        console.error('addPreviousSchoolBtn not found');
    }

    // 휴직 추가 버튼
    if (addLeaveBtn) {
        addLeaveBtn.addEventListener('click', handleAddLeaveClick);
        console.log('Leave button listener added');
    } else {
        console.error('addLeaveBtn not found');
    }

    // 모달 관련 이벤트
    setupPreviousSchoolModalEvents();
    setupLeaveModalEvents();
    
    
    // 자동 파싱 버튼
    const autoParseBtn = document.getElementById('auto-parse-btn');
    if (autoParseBtn) {
        autoParseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Auto parse button clicked');
            showAutoParseModal();
        });
        console.log('Auto parse button listener added');
    } else {
        console.error('autoParseBtn not found');
    }

    // 자동 파싱 모달 이벤트
    setupAutoParseModalEvents();
    console.log('All event listeners set up successfully');
}

function handleCurrentRegionChange(e) {
    currentRegion = e.target.value;
    console.log('Current region selected:', currentRegion);
    
    // 청주시 선택시 세부지역 표시
    if (currentRegion === 'cheongju' && currentCheongjuSubRegion) {
        currentCheongjuSubRegion.style.display = 'block';
        currentSubRegion = currentCheongjuType ? currentCheongjuType.value : 'dong';
    } else if (currentCheongjuSubRegion) {
        currentCheongjuSubRegion.style.display = 'none';
        currentSubRegion = null;
    }
    
    updateRegionInfo();
    updateResults();
}

function handleCurrentCheongjuSubRegionChange(e) {
    currentSubRegion = e.target.value;
    console.log('Current Cheongju sub-region selected:', currentSubRegion);
    updateRegionInfo();
    updateResults();
}

function handleCurrentTransferDateChange(e) {
    console.log('Current transfer date changed:', e.target.value);
    currentTransferDate = e.target.value ? new Date(e.target.value) : null;
    updateResults();
}

function handleAddPreviousSchoolClick(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Add previous school button clicked');
    showPreviousSchoolModal();
}

function handleAddLeaveClick(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Add leave button clicked');
    showLeaveModal();
}

function setupPreviousSchoolModalEvents() {
    if (!previousSchoolModal) {
        console.error('Previous school modal not found');
        return;
    }
    
    if (schoolModalCloseBtn) {
        schoolModalCloseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hidePreviousSchoolModal();
        });
    }
    
    if (schoolModalCancelBtn) {
        schoolModalCancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hidePreviousSchoolModal();
        });
    }
    
    if (schoolModalSaveBtn) {
        schoolModalSaveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            savePreviousSchool();
        });
    }
    
    previousSchoolModal.addEventListener('click', function(e) {
        if (e.target === this) {
            hidePreviousSchoolModal();
        }
    });

    // 전임교 모달 내 지역 선택 이벤트
    const schoolRegionSelect = document.getElementById('school-region');
    const schoolCheongjuSubRegion = document.getElementById('school-cheongju-sub-region');
    
    if (schoolRegionSelect && schoolCheongjuSubRegion) {
        schoolRegionSelect.addEventListener('change', function(e) {
            if (e.target.value === 'cheongju') {
                schoolCheongjuSubRegion.style.display = 'block';
            } else {
                schoolCheongjuSubRegion.style.display = 'none';
            }
        });
    }

    console.log('Previous school modal event listeners set up');
}

function setupLeaveModalEvents() {
    if (!leaveModal) {
        console.error('Leave modal not found');
        return;
    }
    
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hideLeaveModal();
        });
    }
    
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hideLeaveModal();
        });
    }
    
    if (modalSaveBtn) {
        modalSaveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            saveLeave();
        });
    }
    
    leaveModal.addEventListener('click', function(e) {
        if (e.target === this) {
            hideLeaveModal();
        }
    });

    // Escape 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (previousSchoolModal && !previousSchoolModal.classList.contains('hidden')) {
                hidePreviousSchoolModal();
            }
            if (leaveModal && !leaveModal.classList.contains('hidden')) {
                hideLeaveModal();
            }
        }
    });
    
    console.log('Leave modal event listeners set up');
}

function showPreviousSchoolModal() {
    console.log('Showing previous school modal');
    
    if (!previousSchoolModal) {
        console.error('Previous school modal not found');
        return;
    }
    
    previousSchoolModal.classList.remove('hidden');
    
    const schoolNameInput = document.getElementById('school-name');
    if (schoolNameInput) {
        setTimeout(() => schoolNameInput.focus(), 100);
    }
    
    console.log('Previous school modal shown');
}

function hidePreviousSchoolModal() {
    console.log('Hiding previous school modal');
    if (previousSchoolModal) {
        previousSchoolModal.classList.add('hidden');
    }
    if (previousSchoolForm) {
        previousSchoolForm.reset();
        // 청주 세부지역 숨기기
        const schoolCheongjuSubRegion = document.getElementById('school-cheongju-sub-region');
        if (schoolCheongjuSubRegion) {
            schoolCheongjuSubRegion.style.display = 'none';
        }
    }
}

function savePreviousSchool() {
    console.log('Saving previous school');
    
    const schoolName = document.getElementById('school-name')?.value.trim() || '';
    const region = document.getElementById('school-region')?.value;
    const subRegion = document.getElementById('school-cheongju-type')?.value;
    const startDate = document.getElementById('school-start-date')?.value;
    const endDate = document.getElementById('school-end-date')?.value;

    if (!region || !startDate || !endDate) {
        alert('필수 정보를 모두 입력해주세요.');
        return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
        alert('종료일은 시작일보다 늦어야 합니다.');
        return;
    }

    // 기간 겹침 체크
    if (checkDateOverlap(start, end)) {
        alert('다른 경력과 기간이 겹칩니다. 확인해주세요.');
        return;
    }

    const regionData = regionalSettings[region];
    const displayName = schoolName || `${regionData?.name || region} 근무`;

    const school = {
        id: Date.now(),
        name: displayName,
        region: region,
        subRegion: region === 'cheongju' ? subRegion : null,
        startDate: start,
        endDate: end,
        duration: calculateServicePeriod(start, end)
    };

    previousSchools.push(school);
    console.log('Previous school added:', school);
    hidePreviousSchoolModal();
    updatePreviousSchoolsList();
    updateLeaveSchoolOptions();
    updateResults();
}

function checkDateOverlap(newStart, newEnd) {
    // 현임교와 겹치는지 확인
    if (currentTransferDate) {
        const today = new Date();
        if (newStart <= today && newEnd >= currentTransferDate) {
            return true;
        }
    }

    // 다른 전임교와 겹치는지 확인
    for (let school of previousSchools) {
        if (newStart <= school.endDate && newEnd >= school.startDate) {
            return true;
        }
    }

    return false;
}

function removePreviousSchool(id) {
    console.log('Removing previous school:', id);
    previousSchools = previousSchools.filter(school => school.id !== id);
    updatePreviousSchoolsList();
    updateLeaveSchoolOptions();
    updateResults();
}

function updatePreviousSchoolsList() {
    if (!previousSchoolsList) return;
    
    if (previousSchools.length === 0) {
        previousSchoolsList.innerHTML = '<p class="text-secondary">추가된 전임교 경력이 없습니다.</p>';
        return;
    }

    // 시작일 기준으로 정렬
    const sortedSchools = [...previousSchools].sort((a, b) => a.startDate - b.startDate);

    previousSchoolsList.innerHTML = sortedSchools.map(school => {
        const regionData = regionalSettings[school.region];
        let regionText = regionData?.name || school.region;
        if (school.region === 'cheongju' && school.subRegion) {
            regionText += ` (${school.subRegion === 'dong' ? '동지역' : '읍·면지역'})`;
        }
        
        return `
            <div class="previous-school-item">
                <div class="school-info">
                    <div class="school-name">${school.name}</div>
                    <div class="school-region">${regionText}</div>
                    <div class="school-period">
                        ${formatDate(school.startDate)} ~ ${formatDate(school.endDate)}
                    </div>
                    <div class="school-duration">
                        근무기간: ${formatServicePeriod(school.duration)}
                    </div>
                </div>
                <div class="school-actions">
                    <button type="button" class="btn-icon" onclick="removePreviousSchool(${school.id})" title="삭제">
                        ×
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function updateLeaveSchoolOptions() {
    const leaveSchoolSelect = document.getElementById('leave-school');
    if (!leaveSchoolSelect) return;

    // 기본 옵션들
    let options = `<option value="">선택해주세요</option>`;
    
    if (currentTransferDate) {
        options += `<option value="current">현임교</option>`;
    }

    // 전임교 옵션들 추가
    previousSchools.forEach(school => {
        options += `<option value="previous-${school.id}">${school.name}</option>`;
    });

    leaveSchoolSelect.innerHTML = options;
}

function showLeaveModal() {
    console.log('Showing leave modal');
    
    if (!currentTransferDate && previousSchools.length === 0) {
        alert('먼저 현임교 또는 전임교 정보를 입력해주세요.');
        return;
    }
    
    if (!leaveModal) {
        console.error('Leave modal not found');
        return;
    }
    
    leaveModal.classList.remove('hidden');
    updateLeaveSchoolOptions();
    
    const leaveSchoolSelect = document.getElementById('leave-school');
    if (leaveSchoolSelect) {
        setTimeout(() => leaveSchoolSelect.focus(), 100);
    }
    
    console.log('Leave modal shown');
}

function hideLeaveModal() {
    console.log('Hiding leave modal');
    if (leaveModal) {
        leaveModal.classList.add('hidden');
    }
    if (leaveForm) {
        leaveForm.reset();
    }
}

function saveLeave() {
    console.log('Saving leave');
    
    const leaveSchool = document.getElementById('leave-school')?.value;
    const leaveType = document.getElementById('leave-type')?.value;
    const startDate = document.getElementById('leave-start')?.value;
    const endDate = document.getElementById('leave-end')?.value;

    if (!leaveSchool || !leaveType || !startDate || !endDate) {
        alert('모든 정보를 입력해주세요.');
        return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
        alert('종료일은 시작일보다 늦어야 합니다.');
        return;
    }

    // 해당 학교 기간 내에 있는지 확인
    if (!isLeaveWithinSchoolPeriod(leaveSchool, start, end)) {
        alert('휴직 기간이 해당 학교 근무 기간을 벗어납니다.');
        return;
    }

    const leave = {
        id: Date.now(),
        school: leaveSchool,
        type: leaveType,
        startDate: start,
        endDate: end,
        duration: calculateLeaveDuration(start, end)
    };

    leaves.push(leave);
    console.log('Leave added:', leave);
    hideLeaveModal();
    updateLeaveList();
    updateResults();
}

function isLeaveWithinSchoolPeriod(schoolId, leaveStart, leaveEnd) {
    if (schoolId === 'current') {
        if (!currentTransferDate) return false;
        const today = new Date();
        return leaveStart >= currentTransferDate && leaveEnd <= today;
    }

    if (schoolId.startsWith('previous-')) {
        const id = parseInt(schoolId.replace('previous-', ''));
        const school = previousSchools.find(s => s.id === id);
        if (!school) return false;
        return leaveStart >= school.startDate && leaveEnd <= school.endDate;
    }

    return false;
}

function updateRegionInfo() {
    if (!currentRegion || !regionInfo) {
        return;
    }
    
    const regionData = regionalSettings[currentRegion];
    if (!regionData) {
        return;
    }
    
    let regionText = regionData.name;
    if (currentRegion === 'cheongju' && currentSubRegion) {
        regionText += ` (${currentSubRegion === 'dong' ? '동지역' : '읍·면지역'})`;
    }
    
    if (selectedRegionText) selectedRegionText.textContent = regionText;
    if (regionalLimitText) regionalLimitText.textContent = `${regionData.regionalTerm}년`;
    regionInfo.style.display = 'block';
    
    console.log('Region info updated:', regionText, regionData.regionalTerm + '년');
}

function updateResults() {
    console.log('Updating results - currentTransferDate:', currentTransferDate, 'currentRegion:', currentRegion);
    
    if (!currentTransferDate || !currentRegion) {
        resetResults();
        return;
    }

    const today = new Date();
    const currentService = calculateServicePeriod(currentTransferDate, today);
    
    // 현임교 근무기간 표시
    if (currentServiceEl) {
        currentServiceEl.textContent = formatServicePeriod(currentService);
    }

    // 지역별 총 근무기간 계산
    const totalRegionalService = calculateTotalRegionalService();
    if (totalRegionalServiceEl) {
        totalRegionalServiceEl.textContent = formatServicePeriod(totalRegionalService);
    }

    // 지역별 근무기간 요약 업데이트
    updateRegionalServiceSummary();

    // 만기일 계산
    calculateAndDisplayExpiryDates();

    // 휴직 요약 표시
    updateLeaveSummary();
    
    console.log('Results updated successfully');
}

function calculateTotalRegionalService() {
    if (!currentRegion || !currentTransferDate) {
        return { years: 0, months: 0, days: 0, totalDays: 0 };
    }

    let totalDays = 0;
    const today = new Date();

    // 현임교 기간 추가
    const currentDays = Math.floor((today - currentTransferDate) / (1000 * 60 * 60 * 24));
    totalDays += currentDays;

    // 동일 지역 전임교 기간 추가
    previousSchools.forEach(school => {
        if (isSameRegion(school.region, school.subRegion, currentRegion, currentSubRegion)) {
            totalDays += school.duration.totalDays;
        }
    });

    // 휴직 기간 제외 처리
    const { excludedDays } = calculateEffectiveService();
    const effectiveDays = Math.max(0, totalDays - excludedDays);

    return convertDaysToServicePeriod(effectiveDays);
}

function isSameRegion(region1, subRegion1, region2, subRegion2) {
    if (region1 !== region2) return false;
    
    // 청주시의 경우 동지역/읍면지역 구분
    if (region1 === 'cheongju') {
        return subRegion1 === subRegion2;
    }
    
    return true;
}

function updateRegionalServiceSummary() {
    if (!serviceSummary || !regionalServiceSummary || !currentRegion) {
        if (serviceSummary) serviceSummary.style.display = 'none';
        return;
    }

    const regionSummary = {};
    const today = new Date();

    // 현임교 추가
    const currentKey = getRegionKey(currentRegion, currentSubRegion);
    const currentDays = Math.floor((today - currentTransferDate) / (1000 * 60 * 60 * 24));
    regionSummary[currentKey] = (regionSummary[currentKey] || 0) + currentDays;

    // 전임교들 추가
    previousSchools.forEach(school => {
        const key = getRegionKey(school.region, school.subRegion);
        regionSummary[key] = (regionSummary[key] || 0) + school.duration.totalDays;
    });

    let summaryHtml = '';
    Object.keys(regionSummary).forEach(regionKey => {
        const days = regionSummary[regionKey];
        const period = convertDaysToServicePeriod(days);
        const regionName = getRegionDisplayName(regionKey);
        
        summaryHtml += `
            <div class="regional-summary-item">
                <div class="region-name">${regionName}</div>
                <div class="duration">${formatServicePeriod(period)}</div>
            </div>
        `;
    });

    regionalServiceSummary.innerHTML = summaryHtml;
    serviceSummary.style.display = 'block';
}

function getRegionKey(region, subRegion) {
    if (region === 'cheongju' && subRegion) {
        return `${region}-${subRegion}`;
    }
    return region;
}

function getRegionDisplayName(regionKey) {
    const [region, subRegion] = regionKey.split('-');
    const regionData = regionalSettings[region];
    let name = regionData?.name || region;
    
    if (region === 'cheongju' && subRegion) {
        name += ` (${subRegion === 'dong' ? '동지역' : '읍·면지역'})`;
    }
    
    return name;
}



// 효과적인 재직기간 계산 (휴직 1년 기준 적용)
function calculateEffectiveService(transferDate, today, leaves) {
    if (!transferDate) return { totalDays: 0, schoolEffectiveDays: 0, regionalEffectiveDays: 0 };

    const totalDays = Math.floor((today - transferDate) / (1000 * 60 * 60 * 24)) + 1;

    // 학교 만기용: 1년 이상 휴직만 제외
    let schoolExcludedDays = 0;
    // 지역 만기용: 모든 불인정 휴직 제외
    let regionalExcludedDays = 0;

    leaves.forEach(leave => {
        const leaveTypeData = leaveTypes[leave.type];
        const leaveDays = Math.floor((leave.endDate - leave.startDate) / (1000 * 60 * 60 * 24)) + 1;

        // 1년 이상 휴직인지 확인 (새로운 로직)
        const isOneYearOrMore = leave.isOneYearOrMore || (leaveDays >= 365);

        if (isOneYearOrMore) {
            // 1년 이상 휴직: 학교 만기에서 제외
            schoolExcludedDays += leaveDays;
        }

        // 지역 만기: 기존 규정대로 (includedInService가 false인 것만 제외)
        if (!leaveTypeData.includedInService) {
            regionalExcludedDays += leaveDays;
        }

        console.log(`휴직 처리: ${leaveTypeData.label}, ${leaveDays}일, ` +
                   `학교만기: ${isOneYearOrMore ? '제외' : '포함'}, ` +
                   `지역만기: ${leaveTypeData.includedInService ? '포함' : '제외'}`);
    });

    return {
        totalDays,
        schoolEffectiveDays: totalDays - schoolExcludedDays,
        regionalEffectiveDays: totalDays - regionalExcludedDays
    };
}

function calculateAndDisplayExpiryDates() {
    if (!currentTransferDate) {
        console.log('현재 전입일이 설정되지 않음');
        return;
    }

    const today = new Date();
    const regionData = regionalSettings[currentRegion] || regionalSettings['other'];

    // 효과적인 재직기간 계산 (휴직 1년 기준 적용)
    const serviceData = calculateEffectiveService(currentTransferDate, today, leaves);

    // 학교 만기 계산 (5년 기준, 1년 이상 휴직 제외)
    const schoolTermDays = regionData.schoolTerm * 365;
    const schoolRemainingDays = Math.max(0, schoolTermDays - serviceData.schoolEffectiveDays);
    const schoolExpiryDate = new Date(today.getTime() + schoolRemainingDays * 24 * 60 * 60 * 1000);

    // 지역 만기 계산 (기존 방식)
    let totalRegionalDays = serviceData.regionalEffectiveDays;

    // 전임교 경력 추가 (지역별)
    previousSchools.forEach(school => {
        if (school.region === currentRegion) {
            const schoolDays = Math.floor((school.endDate - school.startDate) / (1000 * 60 * 60 * 24)) + 1;
            totalRegionalDays += schoolDays;
        }
    });

    const regionalTermDays = regionData.regionalTerm * 365;
    const regionalRemainingDays = Math.max(0, regionalTermDays - totalRegionalDays);
    const regionalExpiryDate = new Date(today.getTime() + regionalRemainingDays * 24 * 60 * 60 * 1000);

    // UI 업데이트
    if (schoolExpiryEl) {
        schoolExpiryEl.textContent = formatDate(schoolExpiryDate);
    }
    if (regionalExpiryEl) {
        regionalExpiryEl.textContent = formatDate(regionalExpiryDate);
    }
    if (schoolRemainingEl) {
        const years = Math.floor(schoolRemainingDays / 365);
        const months = Math.floor((schoolRemainingDays % 365) / 30);
        schoolRemainingEl.textContent = years > 0 ? `${years}년 ${months}개월` : `${months}개월`;
    }
    if (regionalRemainingEl) {
        const years = Math.floor(regionalRemainingDays / 365);
        const months = Math.floor((regionalRemainingDays % 365) / 30);
        regionalRemainingEl.textContent = years > 0 ? `${years}년 ${months}개월` : `${months}개월`;
    }

    console.log('만기 계산 완료:', {
        학교효과일수: serviceData.schoolEffectiveDays,
        지역효과일수: totalRegionalDays,
        학교남은일수: schoolRemainingDays,
        지역남은일수: regionalRemainingDays
    });
}

function getFirstRegionalEntryDate() {
    let firstDate = currentTransferDate;

    // 동일 지역 전임교 중 가장 이른 시작일 찾기
    previousSchools.forEach(school => {
        if (isSameRegion(school.region, school.subRegion, currentRegion, currentSubRegion)) {
            if (school.startDate < firstDate) {
                firstDate = school.startDate;
            }
        }
    });

    return firstDate;
}

function calculateEffectiveService() {
    let excludedDays = 0;

    leaves.forEach(leave => {
        const leaveDays = leave.duration.totalDays;
        const leaveTypeData = leaveTypes[leave.type];
        
        // 2025년 개정 규정에 따른 처리
        if (!leaveTypeData.includedInService) {
            // 재직기간에서 제외되는 휴직
            excludedDays += leaveDays;
        }
    });

    return { excludedDays };
}

function calculateServicePeriod(startDate, endDate) {
    const diffTime = endDate - startDate;
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (totalDays < 0) {
        return { years: 0, months: 0, days: 0, totalDays: 0 };
    }

    return convertDaysToServicePeriod(totalDays);
}

function convertDaysToServicePeriod(totalDays) {
    const years = Math.floor(totalDays / 365);
    const remainingDays = totalDays % 365;
    const months = Math.floor(remainingDays / 30);
    const days = remainingDays % 30;

    return { years, months, days, totalDays };
}

function calculateLeaveDuration(startDate, endDate) {
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;

    return { totalDays: diffDays, years, months, days };
}

function removeLeave(id) {
    console.log('Removing leave:', id);
    leaves = leaves.filter(leave => leave.id !== id);
    updateLeaveList();
    updateResults();
}

function updateLeaveList() {
    if (!leaveList) return;
    
    if (leaves.length === 0) {
        leaveList.innerHTML = '<p class="text-secondary">추가된 휴직 정보가 없습니다.</p>';
        return;
    }

    leaveList.innerHTML = leaves.map(leave => {
        const leaveTypeData = leaveTypes[leave.type];
        const statusClass = leaveTypeData.includedInService ? 'status--success' : 'status--error';
        const statusText = leaveTypeData.includedInService ? '재직기간 인정' : '재직기간 제외';
        
        // 해당 학교 정보
        let schoolName = '현임교';
        if (leave.school.startsWith('previous-')) {
            const id = parseInt(leave.school.replace('previous-', ''));
            const school = previousSchools.find(s => s.id === id);
            schoolName = school ? school.name : '전임교';
        }
        
        return `
            <div class="leave-item">
                <div class="leave-info">
                    <div class="leave-type">${leaveTypeData.label}</div>
                    <div class="leave-school">소속: ${schoolName}</div>
                    <div class="leave-period">
                        ${formatDate(leave.startDate)} ~ ${formatDate(leave.endDate)}
                    </div>
                    <div class="leave-duration">
                        기간: ${formatDuration(leave.duration)}
                    </div>
                    <div class="leave-status">
                        <span class="status ${statusClass}">${statusText}</span>
                    </div>
                </div>
                <div class="leave-actions">
                    <button type="button" class="btn-icon" onclick="removeLeave(${leave.id})" title="삭제">
                        ×
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function formatDate(date) {
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function formatDuration(duration) {
    const parts = [];
    if (duration.years > 0) parts.push(`${duration.years}년`);
    if (duration.months > 0) parts.push(`${duration.months}개월`);
    if (duration.days > 0) parts.push(`${duration.days}일`);
    return parts.join(' ') || '1일';
}

function formatServicePeriod(period) {
    const parts = [];
    if (period.years > 0) parts.push(`${period.years}년`);
    if (period.months > 0) parts.push(`${period.months}개월`);
    if (period.days > 0) parts.push(`${period.days}일`);
    return parts.join(' ') || '0일';
}

function resetResults() {
    if (currentServiceEl) currentServiceEl.textContent = '-';
    if (totalRegionalServiceEl) totalRegionalServiceEl.textContent = '-';
    if (schoolExpiryEl) schoolExpiryEl.textContent = '-';
    if (regionalExpiryEl) regionalExpiryEl.textContent = '-';
    if (schoolRemainingEl) schoolRemainingEl.textContent = '현임교 5년 기준';
    if (regionalRemainingEl) regionalRemainingEl.textContent = '전체 경력 기준';
    
    if (leaveSummaryEl) {
        leaveSummaryEl.style.display = 'none';
    }
    
    if (serviceSummary) {
        serviceSummary.style.display = 'none';
    }
}

function updateLeaveSummary() {
    if (!leaveSummaryEl || !leaveSummaryContentEl) return;
    
    if (leaves.length === 0) {
        leaveSummaryEl.style.display = 'none';
        return;
    }

    leaveSummaryEl.style.display = 'block';
    
    let summaryHtml = '';
    let totalExcluded = 0;
    let totalIncluded = 0;

    leaves.forEach(leave => {
        const leaveDays = leave.duration.totalDays;
        const leaveTypeData = leaveTypes[leave.type];
        let status = '';
        let statusClass = '';

        // 해당 학교 정보
        let schoolName = '현임교';
        if (leave.school.startsWith('previous-')) {
            const id = parseInt(leave.school.replace('previous-', ''));
            const school = previousSchools.find(s => s.id === id);
            schoolName = school ? school.name : '전임교';
        }

        if (leaveTypeData.includedInService) {
            status = '재직기간 인정';
            statusClass = 'status--success';
            totalIncluded += leaveDays;
        } else {
            status = '재직기간 제외';
            statusClass = 'status--error';
            totalExcluded += leaveDays;
        }

        summaryHtml += `
            <div class="leave-summary-item">
                <div>
                    <strong>${leaveTypeData.label}</strong> (${schoolName})<br>
                    <small>${formatDate(leave.startDate)} ~ ${formatDate(leave.endDate)} (${formatDuration(leave.duration)})</small><br>
                    <small style="color: var(--color-text-secondary);">${leaveTypeData.description}</small>
                </div>
                <div>
                    <span class="status ${statusClass}">${status}</span>
                </div>
            </div>
        `;
    });

    // 합계 정보 추가
    if (totalExcluded > 0 || totalIncluded > 0) {
        summaryHtml += `
            <div class="leave-summary-item" style="border-top: 2px solid var(--color-border); margin-top: var(--space-16); padding-top: var(--space-16);">
                <div><strong>2025년 개정 규정 적용 결과</strong></div>
                <div>
                    ${totalIncluded > 0 ? `<span class="status status--success">인정 ${Math.floor(totalIncluded)}일</span> ` : ''}
                    ${totalExcluded > 0 ? `<span class="status status--error">제외 ${Math.floor(totalExcluded)}일</span>` : ''}
                </div>
            </div>
        `;
    }

    leaveSummaryContentEl.innerHTML = summaryHtml;
}

// 전역 함수로 노출 (HTML onclick에서 사용)
window.removePreviousSchool = removePreviousSchool;
window.removeLeave = removeLeave;

// ==================== 자동 경력 데이터 파싱 기능 ====================

// 휴직 키워드 매핑
const leaveKeywordMap = {
    '육아휴직': 'parental',
    '7호:육아휴직': 'parental', 
    '질병휴직': 'sick',
    '유학휴직': 'study',
    '병역휴직': 'military',
    '가족돌봄휴직': 'family_care',
    '노조전임자': 'union_official',
    '휴직': 'other'
};

// 지역 키워드 매핑
// 지역 키워드 매핑
const regionKeywordMap = {
    'chungju': ['충주', '충주시', '충주고등학교', '충주여자고등학교'],
    'jecheon': ['제천', '제천시'],
    'cheongju': ['청주', '청주시', '상당구', '서원구', '흥덕구', '청원구'],
    'other': []
};

// 경력 데이터 파싱 함수
function parseCareerData(textData) {
    console.log('경력 데이터 파싱 시작:', textData.length, '글자');

    const lines = textData.trim().split('\n');
    const parsedSchools = [];
    const parsedLeaves = [];
    const errors = [];

    const datePattern = /(\d{4})\.(\d{1,2})\.(\d{1,2})\s*~\s*(\d{4})\.(\d{1,2})\.(\d{1,2})/;

    lines.forEach((line, index) => {
        if (!line.trim()) return;

        console.log(`라인 ${index + 1} 파싱:`, line.substring(0, 50) + '...');

        // 날짜 추출
        const dateMatch = line.match(datePattern);
        if (!dateMatch) {
            errors.push(`라인 ${index + 1}: 날짜 패턴을 찾을 수 없습니다`);
            return;
        }

        const startYear = parseInt(dateMatch[1]);
        const startMonth = parseInt(dateMatch[2]);
        const startDay = parseInt(dateMatch[3]);
        const endYear = parseInt(dateMatch[4]);
        const endMonth = parseInt(dateMatch[5]);
        const endDay = parseInt(dateMatch[6]);

        const startDate = new Date(startYear, startMonth - 1, startDay);
        const endDate = new Date(endYear, endMonth - 1, endDay);

        // 데이터 구조 파싱: 기간, 임용구분, 직급, 부서, 발령
        const parts = line.split('\t');
        if (parts.length < 5) {
            errors.push(`라인 ${index + 1}: 데이터 구조가 올바르지 않습니다 (5개 컬럼 필요)`);
            return;
        }

        const period = parts[0].trim();          // 기간
        const appointmentType = parts[1].trim(); // 임용구분  
        const position = parts[2].trim();        // 직급
        const department = parts[3].trim();      // 부서
        const assignment = parts[4].trim();      // 발령

        // 지역 확인
        let detectedRegion = 'other';
        const fullText = line.toLowerCase();
        for (const [region, keywords] of Object.entries(regionKeywordMap)) {
            if (keywords.some(keyword => fullText.includes(keyword.toLowerCase()))) {
                detectedRegion = region;
                break;
            }
        }

        // 임용구분에서 '휴직' 여부 확인
        if (appointmentType.includes('휴직')) {
            // 휴직 기간 계산
            const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            const isOneYearOrMore = totalDays >= 365;

            // 휴직 유형 결정 (기본적으로는 모두 일반 휴직이지만, 키워드로 세분화)
            let leaveType = 'other';
            if (appointmentType.includes('육아') || appointmentType.includes('7호')) {
                leaveType = 'parental';
            } else if (appointmentType.includes('질병')) {
                leaveType = 'sick'; 
            } else if (appointmentType.includes('유학')) {
                leaveType = 'study';
            } else if (appointmentType.includes('병역')) {
                leaveType = 'military';
            } else if (appointmentType.includes('가족돌봄')) {
                leaveType = 'family_care';
            } else if (appointmentType.includes('노조')) {
                leaveType = 'union_official';
            }

            parsedLeaves.push({
                type: leaveType,
                startDate: startDate,
                endDate: endDate,
                school: 'current', // 현임교로 기본 설정
                isOneYearOrMore: isOneYearOrMore,
                totalDays: totalDays,
                appointmentType: appointmentType,
                originalLine: line,
                lineNumber: index + 1
            });

            console.log(`  ✅ 휴직: ${leaveType}, ${totalDays}일 (${isOneYearOrMore ? '1년이상' : '1년미만'})`);

        } else {
            // 일반 근무 (보직교사, 담임교사 등)
            const schoolName = assignment || `${department} 근무` || `${detectedRegion} 근무`;

            parsedSchools.push({
                name: schoolName,
                region: detectedRegion,
                subRegion: detectedRegion === 'cheongju' ? 'dong' : null,
                startDate: startDate,
                endDate: endDate,
                appointmentType: appointmentType,
                position: position,
                department: department,
                originalLine: line,
                lineNumber: index + 1
            });

            console.log(`  ✅ 일반근무: ${schoolName}, ${detectedRegion}, ${appointmentType}`);
        }
    });

    console.log('파싱 완료:', {
        일반근무: parsedSchools.length,
        휴직: parsedLeaves.length,
        오류: errors.length
    });

    return { schools: parsedSchools, leaves: parsedLeaves, errors };
}

// 파싱된 데이터를 시스템에 자동 등록
function registerParsedData(parsedData) {
    const { schools, leaves, errors } = parsedData;
    let successCount = 0;
    let failCount = 0;

    // 전임교 경력 등록
    schools.forEach(school => {
        try {
            // 중복 체크
            const isDuplicate = previousSchools.some(existing => 
                existing.startDate.getTime() === school.startDate.getTime() &&
                existing.endDate.getTime() === school.endDate.getTime()
            );

            if (!isDuplicate) {
                const newSchool = {
                    id: Date.now() + Math.random(),
                    name: school.name,
                    region: school.region,
                    subRegion: school.subRegion,
                    startDate: school.startDate,
                    endDate: school.endDate,
                    duration: calculateServicePeriod(school.startDate, school.endDate)
                };

                previousSchools.push(newSchool);
                successCount++;
                console.log('전임교 등록:', newSchool.name);
            } else {
                console.log('전임교 중복 제외:', school.name);
            }
        } catch (error) {
            console.error('전임교 등록 오류:', error);
            failCount++;
        }
    });

    // 휴직 정보 등록
    leaves.forEach(leave => {
        try {
            // 중복 체크
            const isDuplicate = leaves.some(existing =>
                existing.startDate.getTime() === leave.startDate.getTime() &&
                existing.endDate.getTime() === leave.endDate.getTime() &&
                existing.type === leave.type
            );

            if (!isDuplicate) {
                const newLeave = {
                    id: Date.now() + Math.random(),
                    type: leave.type,
                    school: leave.school,
                    startDate: leave.startDate,
                    endDate: leave.endDate,
                    duration: calculateServicePeriod(leave.startDate, leave.endDate),
                    isOneYearOrMore: leave.isOneYearOrMore, // 1년 이상 여부 저장
                    totalDays: leave.totalDays,
                    appointmentType: leave.appointmentType
                };

                leaves.push(newLeave);
                successCount++;
                console.log('휴직 등록:', leaveTypes[leave.type].label);
            } else {
                console.log('휴직 중복 제외:', leaveTypes[leave.type].label);
            }
        } catch (error) {
            console.error('휴직 등록 오류:', error);
            failCount++;
        }
    });

    // UI 업데이트
    updatePreviousSchoolsList();
    updateLeaveList();
    updateLeaveSchoolOptions();
    updateResults();

    // 결과 메시지
    let message = `등록 완료!\n성공: ${successCount}개`;
    if (failCount > 0) message += `\n실패: ${failCount}개`;
    if (errors.length > 0) message += `\n오류: ${errors.length}개`;

    alert(message);

    if (errors.length > 0) {
        console.log('파싱 오류 목록:', errors);
    }

    return { successCount, failCount, errors };
}

// 자동 파싱 모달 표시
function showAutoParseModal() {
    const modal = document.getElementById('auto-parse-modal');
    if (modal) {
        modal.classList.remove('hidden');
        const textarea = document.getElementById('career-data-input');
        if (textarea) {
            setTimeout(() => textarea.focus(), 100);
        }
    }
}

// 자동 파싱 모달 숨기기
function hideAutoParseModal() {
    const modal = document.getElementById('auto-parse-modal');
    if (modal) {
        modal.classList.add('hidden');
        // 입력 필드 초기화
        const textarea = document.getElementById('career-data-input');
        if (textarea) textarea.value = '';

        const preview = document.getElementById('parse-preview');
        if (preview) preview.innerHTML = '';
    }
}

// 파싱 미리보기
function previewParsedData() {
    const textarea = document.getElementById('career-data-input');
    const preview = document.getElementById('parse-preview');

    if (!textarea || !preview) return;

    const textData = textarea.value.trim();
    if (!textData) {
        preview.innerHTML = '<p class="text-secondary">데이터를 입력해주세요.</p>';
        return;
    }

    try {
        const parsed = parseCareerData(textData);

        let html = '<div class="parse-preview-content">';

        // 일반 근무 경력
        if (parsed.schools.length > 0) {
            html += '<h4>일반 근무 경력 (' + parsed.schools.length + '개)</h4>';
            html += '<ul class="preview-list">';
            parsed.schools.forEach(school => {
                html += `<li><strong>${school.name}</strong> (${regionalSettings[school.region]?.name}) - ${formatDate(school.startDate)} ~ ${formatDate(school.endDate)} <span class="text-secondary">[${school.appointmentType}]</span></li>`;
            });
            html += '</ul>';
        }

        // 휴직 정보  
        if (parsed.leaves.length > 0) {
            html += '<h4>휴직 정보 (' + parsed.leaves.length + '개)</h4>';
            html += '<ul class="preview-list">';
            parsed.leaves.forEach(leave => {
                const effect = leave.isOneYearOrMore ? '학교만기 제외' : '재직기간 포함';
                const effectClass = leave.isOneYearOrMore ? 'error-item' : 'status--success';
                html += `<li><strong>${leaveTypes[leave.type].label}</strong> - ${formatDate(leave.startDate)} ~ ${formatDate(leave.endDate)} <span class="${effectClass}">[${effect}]</span> <span class="text-secondary">(${leave.totalDays}일)</span></li>`;
            });
            html += '</ul>';
        }

        // 오류
        if (parsed.errors.length > 0) {
            html += '<h4>오류 (' + parsed.errors.length + '개)</h4>';
            html += '<ul class="error-list">';
            parsed.errors.forEach(error => {
                html += `<li class="error-item">${error}</li>`;
            });
            html += '</ul>';
        }

        if (parsed.schools.length === 0 && parsed.leaves.length === 0) {
            html += '<p class="text-secondary">파싱할 수 있는 데이터가 없습니다.</p>';
            html += '<p class="text-secondary">데이터 형식: 기간 [탭] 임용구분 [탭] 직급 [탭] 부서 [탭] 발령</p>';
        }

        html += '</div>';
        preview.innerHTML = html;

    } catch (error) {
        preview.innerHTML = `<p class="error-item">파싱 오류: ${error.message}</p>`;
    }
}

// 자동 등록 실행
function executeAutoParse() {
    const textarea = document.getElementById('career-data-input');
    if (!textarea) return;

    const textData = textarea.value.trim();
    if (!textData) {
        alert('데이터를 입력해주세요.');
        return;
    }

    try {
        const parsed = parseCareerData(textData);

        if (parsed.schools.length === 0 && parsed.leaves.length === 0) {
            alert('파싱할 수 있는 데이터가 없습니다.');
            return;
        }

        const result = registerParsedData(parsed);
        hideAutoParseModal();

    } catch (error) {
        alert('오류가 발생했습니다: ' + error.message);
        console.error('Auto parse error:', error);
    }
}


// 자동 파싱 모달 이벤트 설정
function setupAutoParseModalEvents() {
    const modal = document.getElementById('auto-parse-modal');
    const closeBtn = document.getElementById('auto-parse-close-btn');
    const cancelBtn = document.getElementById('auto-parse-cancel-btn');
    const previewBtn = document.getElementById('auto-parse-preview-btn');
    const executeBtn = document.getElementById('auto-parse-execute-btn');
    const textarea = document.getElementById('career-data-input');

    if (closeBtn) closeBtn.addEventListener('click', hideAutoParseModal);
    if (cancelBtn) cancelBtn.addEventListener('click', hideAutoParseModal);
    if (previewBtn) previewBtn.addEventListener('click', previewParsedData);
    if (executeBtn) executeBtn.addEventListener('click', executeAutoParse);

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) hideAutoParseModal();
        });
    }

    // 입력시 자동 미리보기 (디바운스)
    if (textarea) {
        let timeout;
        textarea.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(previewParsedData, 500);
        });
    }

    console.log('Auto parse modal events set up');
}