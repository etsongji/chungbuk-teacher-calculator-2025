// 전역 변수
let leaves = [];
let transferDate = null;
let selectedRegion = null;
let selectedSubRegion = null;

// DOM 요소들
let regionSelect, cheongjuSubRegion, cheongjuType, transferDateInput;
let addLeaveBtn, leaveModal, modalCloseBtn, modalCancelBtn, modalSaveBtn;
let leaveForm, leaveList, regionInfo, selectedRegionText, regionalLimitText;
let currentServiceEl, effectiveServiceEl, schoolExpiryEl, regionalExpiryEl;
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
    console.log('DOM Content Loaded - 2025 Regulation Calculator');
    initializeElements();
    setupEventListeners();
    setupDateInputs();
    updateResults();
});

function initializeElements() {
    // DOM 요소 초기화
    regionSelect = document.getElementById('region-select');
    cheongjuSubRegion = document.getElementById('cheongju-sub-region');
    cheongjuType = document.getElementById('cheongju-type');
    transferDateInput = document.getElementById('transfer-date');
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
    currentServiceEl = document.getElementById('current-service');
    effectiveServiceEl = document.getElementById('effective-service');
    schoolExpiryEl = document.getElementById('school-expiry');
    regionalExpiryEl = document.getElementById('regional-expiry');
    schoolRemainingEl = document.getElementById('school-remaining');
    regionalRemainingEl = document.getElementById('regional-remaining');
    leaveSummaryEl = document.getElementById('leave-summary');
    leaveSummaryContentEl = document.getElementById('leave-summary-content');
    
    console.log('Elements initialized');
}

function setupDateInputs() {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    if (transferDateInput) {
        transferDateInput.setAttribute('max', todayString);
        transferDateInput.value = '';
        
        // 기본값을 1년 전으로 설정 (테스트 편의를 위해)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const oneYearAgoString = oneYearAgo.toISOString().split('T')[0];
        transferDateInput.value = oneYearAgoString;
        transferDate = oneYearAgo;
    }
}

function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // 지역 선택 이벤트
    if (regionSelect) {
        regionSelect.addEventListener('change', handleRegionChange);
        regionSelect.addEventListener('input', handleRegionChange);
        
        console.log('Region select event listeners added');
    } else {
        console.error('Region select element not found');
    }
    
    // 청주시 세부지역 선택
    if (cheongjuType) {
        cheongjuType.addEventListener('change', handleCheongjuSubRegionChange);
        cheongjuType.addEventListener('input', handleCheongjuSubRegionChange);
    }

    // 전입일자 변경 이벤트
    if (transferDateInput) {
        transferDateInput.addEventListener('change', handleTransferDateChange);
        transferDateInput.addEventListener('input', handleTransferDateChange);
        
        console.log('Transfer date event listeners added');
    } else {
        console.error('Transfer date input element not found');
    }

    // 휴직 추가 버튼
    if (addLeaveBtn) {
        addLeaveBtn.addEventListener('click', handleAddLeaveClick);
        console.log('Add leave button event listener added');
    } else {
        console.error('Add leave button element not found');
    }

    // 모달 관련 이벤트
    setupModalEvents();
    
    console.log('All event listeners set up');
}

function handleRegionChange(e) {
    selectedRegion = e.target.value;
    console.log('Region selected:', selectedRegion);
    
    // 청주시 선택시 세부지역 표시
    if (selectedRegion === 'cheongju') {
        if (cheongjuSubRegion) {
            cheongjuSubRegion.style.display = 'block';
            selectedSubRegion = cheongjuType ? cheongjuType.value : 'dong';
        }
    } else {
        if (cheongjuSubRegion) {
            cheongjuSubRegion.style.display = 'none';
        }
        selectedSubRegion = null;
    }
    
    updateRegionInfo();
    updateResults();
}

function handleCheongjuSubRegionChange(e) {
    selectedSubRegion = e.target.value;
    console.log('Cheongju sub-region selected:', selectedSubRegion);
    updateRegionInfo();
    updateResults();
}

function handleTransferDateChange(e) {
    console.log('Transfer date changed:', e.target.value);
    transferDate = e.target.value ? new Date(e.target.value) : null;
    updateDateConstraints();
    updateResults();
}

function handleAddLeaveClick(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Add leave button clicked');
    showModal();
}

function setupModalEvents() {
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hideModal();
        });
    }
    
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hideModal();
        });
    }
    
    if (leaveModal) {
        leaveModal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideModal();
            }
        });
    }

    if (modalSaveBtn) {
        modalSaveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            saveLeave();
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && leaveModal && !leaveModal.classList.contains('hidden')) {
            hideModal();
        }
    });
    
    console.log('Modal event listeners set up');
}

function updateRegionInfo() {
    if (!selectedRegion || !regionInfo) {
        console.log('Region info update skipped - missing data');
        return;
    }
    
    const regionData = regionalSettings[selectedRegion];
    if (!regionData) {
        console.log('No region data found for:', selectedRegion);
        return;
    }
    
    let regionText = regionData.name;
    if (selectedRegion === 'cheongju' && selectedSubRegion) {
        regionText += ` (${selectedSubRegion === 'dong' ? '동지역' : '읍·면지역'})`;
    }
    
    if (selectedRegionText) selectedRegionText.textContent = regionText;
    if (regionalLimitText) regionalLimitText.textContent = `${regionData.regionalTerm}년`;
    regionInfo.style.display = 'block';
    
    console.log('Region info updated:', regionText, regionData.regionalTerm + '년');
}

function updateDateConstraints() {
    const today = new Date().toISOString().split('T')[0];
    const leaveStartInput = document.getElementById('leave-start');
    const leaveEndInput = document.getElementById('leave-end');
    
    if (transferDate && leaveStartInput && leaveEndInput) {
        const transferDateString = transferDateInput.value;
        leaveStartInput.setAttribute('min', transferDateString);
        leaveEndInput.setAttribute('min', transferDateString);
        leaveStartInput.setAttribute('max', today);
        leaveEndInput.setAttribute('max', today);
    }
}

function showModal() {
    console.log('Showing modal');
    
    if (!transferDate) {
        alert('먼저 전입일자를 입력해주세요.');
        return;
    }
    
    if (leaveModal) {
        leaveModal.classList.remove('hidden');
        updateDateConstraints();
        
        // 모달 내 이벤트 리스너 설정
        setupModalInputEvents();
        
        const leaveTypeInput = document.getElementById('leave-type');
        if (leaveTypeInput) {
            leaveTypeInput.focus();
        }
        
        console.log('Modal shown');
    } else {
        console.error('Leave modal element not found');
    }
}

function setupModalInputEvents() {
    const leaveStartInput = document.getElementById('leave-start');
    const leaveEndInput = document.getElementById('leave-end');
    
    if (leaveStartInput && leaveEndInput) {
        leaveStartInput.addEventListener('change', function() {
            if (this.value) {
                leaveEndInput.setAttribute('min', this.value);
            }
        });
    }
}

function hideModal() {
    console.log('Hiding modal');
    if (leaveModal) {
        leaveModal.classList.add('hidden');
    }
    if (leaveForm) {
        leaveForm.reset();
    }
}

function saveLeave() {
    console.log('Saving leave');
    
    const leaveType = document.getElementById('leave-type')?.value;
    const startDate = document.getElementById('leave-start')?.value;
    const endDate = document.getElementById('leave-end')?.value;

    if (!leaveType || !startDate || !endDate) {
        alert('모든 정보를 입력해주세요.');
        return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
        alert('종료일은 시작일보다 늦어야 합니다.');
        return;
    }

    if (start < transferDate) {
        alert('휴직 시작일은 전입일자보다 늦어야 합니다.');
        return;
    }

    const leave = {
        id: Date.now(),
        type: leaveType,
        startDate: start,
        endDate: end,
        duration: calculateLeaveDuration(start, end)
    };

    leaves.push(leave);
    console.log('Leave added:', leave);
    hideModal();
    updateLeaveList();
    updateResults();
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
        
        return `
            <div class="leave-item">
                <div class="leave-info">
                    <div class="leave-type">${leaveTypeData.label}</div>
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

function updateResults() {
    console.log('Updating results - transferDate:', transferDate, 'selectedRegion:', selectedRegion);
    
    if (!transferDate || !selectedRegion || !currentServiceEl) {
        resetResults();
        return;
    }

    const today = new Date();
    const currentService = calculateServicePeriod(transferDate, today);
    const { effectiveDays, excludedDays } = calculateEffectiveService();
    
    // 현재 재직기간 표시
    currentServiceEl.textContent = formatServicePeriod(currentService);
    
    // 유효 근무기간 계산
    const effectiveEndDate = new Date(transferDate.getTime() + effectiveDays * 24 * 60 * 60 * 1000);
    const effectiveService = calculateServicePeriod(transferDate, effectiveEndDate);
    effectiveServiceEl.textContent = formatServicePeriod(effectiveService);

    // 지역별 만기 계산
    const regionData = regionalSettings[selectedRegion];
    const schoolTermDays = regionData.schoolTerm * 365; // 5년
    const regionalTermDays = regionData.regionalTerm * 365; // 지역별 차등

    // 만기일 계산 (휴직 제외 기간 추가)
    const schoolExpiryDate = new Date(transferDate.getTime() + (schoolTermDays + excludedDays) * 24 * 60 * 60 * 1000);
    const regionalExpiryDate = new Date(transferDate.getTime() + (regionalTermDays + excludedDays) * 24 * 60 * 60 * 1000);

    // 결과 표시
    schoolExpiryEl.textContent = formatDate(schoolExpiryDate);
    regionalExpiryEl.textContent = formatDate(regionalExpiryDate);

    // 남은 기간 계산
    const schoolRemaining = calculateServicePeriod(today, schoolExpiryDate);
    const regionalRemaining = calculateServicePeriod(today, regionalExpiryDate);

    schoolRemainingEl.textContent = schoolRemaining.totalDays > 0 ? 
        `${formatServicePeriod(schoolRemaining)} 남음` : '만료됨';
    regionalRemainingEl.textContent = regionalRemaining.totalDays > 0 ? 
        `${formatServicePeriod(regionalRemaining)} 남음` : '만료됨';

    // 휴직 요약 표시
    updateLeaveSummary();
    
    console.log('Results updated successfully');
}

function calculateServicePeriod(startDate, endDate) {
    const diffTime = endDate - startDate;
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (totalDays < 0) {
        return { years: 0, months: 0, days: 0, totalDays: 0 };
    }

    const years = Math.floor(totalDays / 365);
    const remainingDays = totalDays % 365;
    const months = Math.floor(remainingDays / 30);
    const days = remainingDays % 30;

    return { years, months, days, totalDays };
}

function calculateEffectiveService() {
    if (!transferDate) return { effectiveDays: 0, excludedDays: 0 };
    
    const today = new Date();
    const totalServiceDays = Math.floor((today - transferDate) / (1000 * 60 * 60 * 24));
    let excludedDays = 0;

    leaves.forEach(leave => {
        const leaveDays = leave.duration.totalDays;
        const leaveTypeData = leaveTypes[leave.type];
        
        // 2025년 개정 규정에 따른 처리
        if (!leaveTypeData.includedInService) {
            // 재직기간에서 제외되는 휴직
            excludedDays += leaveDays;
        }
        // 재직기간에 포함되는 휴직 (육아휴직, 노조전임자, 지역내 파견)은 제외하지 않음
    });

    const effectiveDays = Math.max(0, totalServiceDays - excludedDays);
    
    return { effectiveDays, excludedDays };
}

function formatServicePeriod(period) {
    const parts = [];
    if (period.years > 0) parts.push(`${period.years}년`);
    if (period.months > 0) parts.push(`${period.months}개월`);
    if (period.days > 0) parts.push(`${period.days}일`);
    return parts.join(' ') || '0일';
}

function resetResults() {
    if (!currentServiceEl) return;
    
    currentServiceEl.textContent = '-';
    effectiveServiceEl.textContent = '-';
    schoolExpiryEl.textContent = '-';
    regionalExpiryEl.textContent = '-';
    schoolRemainingEl.textContent = '5년 기준';
    regionalRemainingEl.textContent = '지역별 차등';
    
    if (leaveSummaryEl) {
        leaveSummaryEl.style.display = 'none';
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
                    <strong>${leaveTypeData.label}</strong><br>
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

// 전역 함수로 removeLeave 노출 (HTML onclick에서 사용)
window.removeLeave = removeLeave;