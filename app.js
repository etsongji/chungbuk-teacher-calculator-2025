// 충북 교사 전보 만기계산기 - 만기계산 오류 완전 해결
// 2025년 개정 인사관리기준 적용

class CareerCalculator {
    constructor() {
        // 데이터 저장소
        this.currentRegion = null;
        this.currentSubRegion = null;
        this.currentTransferDate = null;
        this.schools = [];
        this.leaves = [];
        this.parsedData = null;

        // 지역 설정 (2025년 개정 규정)
        this.regionalSettings = {
            'chungju': { 
                name: '충주시', 
                regionalTerm: 15, 
                schoolTerm: 5, 
                notes: '통산 15년 (2025년 개정)' 
            },
            'jecheon': { 
                name: '제천시', 
                regionalTerm: 15, 
                schoolTerm: 5, 
                notes: '통산 15년 (2025년 개정)' 
            },
            'cheongju': { 
                name: '청주시', 
                regionalTerm: 13, 
                schoolTerm: 5, 
                notes: '통산 13년, 동/읍면 구분' 
            },
            'other': { 
                name: '기타지역', 
                regionalTerm: 8, 
                schoolTerm: 5, 
                notes: '일반 지역 8년' 
            }
        };

        // 휴직 유형 설정
        this.leaveTypes = {
            'parental': { label: '육아휴직', includedInService: true, color: '#059669' },
            'sick': { label: '질병휴직', includedInService: false, color: '#dc2626' },
            'study': { label: '유학휴직', includedInService: false, color: '#dc2626' },
            'military': { label: '병역휴직', includedInService: false, color: '#dc2626' },
            'family_care': { label: '가족돌봄휴직', includedInService: false, color: '#dc2626' },
            'union_official': { label: '노조전임자', includedInService: true, color: '#059669' },
            'local_dispatch': { label: '지역내 행정기관 파견', includedInService: true, color: '#059669' },
            'other_dispatch': { label: '기타 파견', includedInService: false, color: '#dc2626' },
            'extension': { label: '휴직연장', includedInService: false, color: '#dc2626' },
            'other': { label: '기타휴직', includedInService: false, color: '#dc2626' }
        };

        // 지역 키워드 매핑
        this.regionKeywordMap = {
            'chungju': ['충주', '충주시', '충주고등학교', '충주여자고등학교', '충주중학교'],
            'jecheon': ['제천', '제천시'],
            'cheongju': ['청주', '청주시', '상당구', '서원구', '흥덕구', '청원구'],
            'other': []
        };

        this.init();
    }

    init() {
        console.log('수정된 경력계산기 시작 - 만기계산 오류 해결');
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // 현임교 정보 이벤트
        const regionSelect = document.getElementById('current-region-select');
        const cheongjuTypeSelect = document.getElementById('current-cheongju-type');
        const transferDateInput = document.getElementById('current-transfer-date');

        if (regionSelect) {
            regionSelect.addEventListener('change', (e) => this.handleRegionChange(e.target.value));
        }

        if (cheongjuTypeSelect) {
            cheongjuTypeSelect.addEventListener('change', (e) => this.handleSubRegionChange(e.target.value));
        }

        if (transferDateInput) {
            transferDateInput.addEventListener('change', (e) => this.handleTransferDateChange(e.target.value));
        }

        // 버튼 이벤트
        this.setupButtonEvents();

        // 자동 파싱 모달 이벤트
        this.setupModalEvents();
    }

    setupButtonEvents() {
        // 자동 등록 버튼
        const autoParseBtn = document.getElementById('auto-parse-btn');
        if (autoParseBtn) {
            autoParseBtn.addEventListener('click', () => this.showAutoParseModal());
        }

        // 샘플 데이터 복사 버튼
        const copySampleBtn = document.getElementById('copy-sample-btn');
        if (copySampleBtn) {
            copySampleBtn.addEventListener('click', () => this.copySampleData());
        }

        // 계산 버튼
        const calculateBtn = document.getElementById('calculate-btn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculateExpiry());
        }

        // 전체 삭제 버튼
        const clearAllBtn = document.getElementById('clear-all-btn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllData());
        }

        // 수동 추가 버튼
        const addSchoolBtn = document.getElementById('add-school-btn');
        if (addSchoolBtn) {
            addSchoolBtn.addEventListener('click', () => this.showManualModal());
        }
    }

    setupModalEvents() {
        // 모달 관련 버튼들
        const modalCloseBtn = document.getElementById('modal-close-btn');
        const parseDataBtn = document.getElementById('parse-data-btn');
        const backToInputBtn = document.getElementById('back-to-input-btn');
        const confirmParseBtn = document.getElementById('confirm-parse-btn');
        const closeModalBtn = document.getElementById('close-modal-btn');

        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => this.hideAutoParseModal());
        }

        if (parseDataBtn) {
            parseDataBtn.addEventListener('click', () => this.parseInputData());
        }

        if (backToInputBtn) {
            backToInputBtn.addEventListener('click', () => this.showStep(1));
        }

        if (confirmParseBtn) {
            confirmParseBtn.addEventListener('click', () => this.confirmParsedData());
        }

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.hideAutoParseModal());
        }

        // 모달 배경 클릭시 닫기
        const modal = document.getElementById('auto-parse-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideAutoParseModal();
                }
            });
        }
    }

    // 현임교 정보 처리
    handleRegionChange(region) {
        console.log('지역 변경:', region);
        this.currentRegion = region;

        // 청주시 세부지역 표시/숨기기
        const cheongjuSubRegion = document.getElementById('current-cheongju-sub-region');
        if (cheongjuSubRegion) {
            if (region === 'cheongju') {
                cheongjuSubRegion.style.display = 'block';
                this.currentSubRegion = 'dong'; // 기본값
            } else {
                cheongjuSubRegion.style.display = 'none';
                this.currentSubRegion = null;
            }
        }

        this.updateCalculationStatus();
        this.calculateExpiry();
    }

    handleSubRegionChange(subRegion) {
        console.log('청주 세부지역 변경:', subRegion);
        this.currentSubRegion = subRegion;
        this.calculateExpiry();
    }

    handleTransferDateChange(dateString) {
        console.log('전입일자 변경:', dateString);
        this.currentTransferDate = dateString ? new Date(dateString) : null;
        this.updateCalculationStatus();
        this.calculateExpiry();
    }

    // 완전히 수정된 파싱 엔진 - 탭 구분 데이터 처리
    parseCareerData(textData) {
        console.log('휴직 인식 개선된 파싱 엔진 시작');
        console.log('입력 데이터 길이:', textData.length);

        const lines = textData.trim().split('\n').filter(line => line.trim());
        const schools = [];
        const leaves = [];
        const skipped = [];
        const errors = [];

        console.log('전체 라인 수:', lines.length);

        // 각 라인을 개별 레코드로 처리 (탭 구분)
        lines.forEach((line, lineIndex) => {
            console.log(`\n라인 ${lineIndex + 1} 분석:`);
            console.log(`원본: "${line}"`);

            try {
                // 탭으로 분할
                const columns = line.split('\t').map(col => col.trim());
                console.log(`컬럼 수: ${columns.length}`);

                if (columns.length < 3) {
                    console.log('  컬럼 부족 - 건너뛰기');
                    skipped.push({
                        reason: '데이터 형식 오류 (컬럼 부족)',
                        line: line,
                        lineNumber: lineIndex + 1
                    });
                    return;
                }

                const period = columns[0] || '';
                const appointmentType = columns[1] || '';
                const position = columns[2] || '';
                const department = columns[3] || '';
                const assignment = columns[4] || '';

                console.log(`  [0] 기간: "${period}"`);
                console.log(`  [1] 임용구분: "${appointmentType}"`);

                // 날짜 파싱
                const { startDate, endDate, totalDays } = this.parseDateRange(period);
                
                if (!startDate || !endDate || totalDays <= 0) {
                    console.error('  날짜 파싱 실패');
                    errors.push(`라인 ${lineIndex + 1}: 날짜 파싱 실패 - ${period}`);
                    return;
                }

                console.log(`  기간: ${this.formatDate(startDate)} ~ ${this.formatDate(endDate)} (${totalDays}일)`);

                // 의미없는 기간 제외 (1일 이하)
                if (totalDays <= 1) {
                    console.log('  제외: 무의미한 기간 (1일 이하)');
                    skipped.push({
                        reason: '무의미한 기간 (1일 이하)',
                        appointmentType,
                        period,
                        days: totalDays,
                        lineNumber: lineIndex + 1
                    });
                    return;
                }

                // 분류 판단
                console.log('  분류 판단 시작...');
                const isSkipRecord = this.isSkipRecord(appointmentType);
                const isLeave = this.isLeaveRecord(appointmentType);

                console.log(`  → isSkipRecord: ${isSkipRecord}`);
                console.log(`  → isLeave: ${isLeave}`);

                if (isSkipRecord) {
                    // 휴직복직, 전보 등 제외
                    const reason = this.getSkipReason(appointmentType);
                    console.log(`  최종 결정: 제외 (${reason})`);
                    skipped.push({
                        reason,
                        appointmentType,
                        period,
                        days: totalDays,
                        lineNumber: lineIndex + 1
                    });
                } else if (isLeave) {
                    // 휴직으로 분류
                    const leaveType = this.detectLeaveType(appointmentType);
                    const isOneYearOrMore = totalDays >= 365;

                    console.log(`  최종 결정: 휴직 - ${this.leaveTypes[leaveType].label}`);
                    console.log(`  휴직 상세: ${totalDays}일, ${isOneYearOrMore ? '1년이상' : '1년미만'}`);

                    leaves.push({
                        type: leaveType,
                        startDate,
                        endDate,
                        totalDays,
                        isOneYearOrMore,
                        appointmentType,
                        period,
                        assignment: assignment || department,
                        lineNumber: lineIndex + 1
                    });
                } else {
                    // 일반 근무로 분류
                    const region = this.detectRegion((department || '') + ' ' + (assignment || ''));
                    const schoolName = this.extractSchoolName(assignment || department || '미상');

                    console.log(`  최종 결정: 일반근무 - ${schoolName} (${this.regionalSettings[region].name})`);

                    schools.push({
                        name: schoolName,
                        region,
                        subRegion: region === 'cheongju' ? 'dong' : null,
                        startDate,
                        endDate,
                        totalDays,
                        appointmentType,
                        period,
                        assignment: assignment || department,
                        lineNumber: lineIndex + 1
                    });
                }

            } catch (error) {
                console.error(`  라인 ${lineIndex + 1} 파싱 오류:`, error);
                errors.push(`라인 ${lineIndex + 1}: 파싱 오류 - ${error.message}`);
            }
        });

        const result = {
            schools,
            leaves,
            skipped,
            errors,
            summary: {
                schoolCount: schools.length,
                leaveCount: leaves.length,
                oneYearPlusLeaves: leaves.filter(l => l.isOneYearOrMore).length,
                skippedCount: skipped.length,
                errorCount: errors.length
            }
        };

        console.log('\n최종 파싱 결과:');
        console.log('요약:', result.summary);

        return result;
    }

    // 날짜 범위 파싱
    parseDateRange(period) {
        console.log(`    날짜 파싱: "${period}"`);
        
        // 정규표현식 패턴들
        const patterns = [
            // 2024.03.01 ~ 2025.02.28 형식
            /(\d{4})\.(\d{1,2})\.(\d{1,2})\s*~\s*(\d{4})\.(\d{1,2})\.(\d{1,2})/,
            // 2024-03-01 ~ 2025-02-28 형식
            /(\d{4})-(\d{1,2})-(\d{1,2})\s*~\s*(\d{4})-(\d{1,2})-(\d{1,2})/,
            // 2024/03/01 ~ 2025/02/28 형식
            /(\d{4})\/(\d{1,2})\/(\d{1,2})\s*~\s*(\d{4})\/(\d{1,2})\/(\d{1,2})/
        ];

        // 진행중인 경우 패턴들
        const ongoingPatterns = [
            /(\d{4})\.(\d{1,2})\.(\d{1,2})\s*~/,
            /(\d{4})-(\d{1,2})-(\d{1,2})\s*~/,
            /(\d{4})\/(\d{1,2})\/(\d{1,2})\s*~/
        ];

        let startDate = null;
        let endDate = null;

        // 완전한 기간 매칭 시도
        for (const pattern of patterns) {
            const match = period.match(pattern);
            if (match) {
                startDate = new Date(
                    parseInt(match[1]),
                    parseInt(match[2]) - 1,
                    parseInt(match[3])
                );
                endDate = new Date(
                    parseInt(match[4]),
                    parseInt(match[5]) - 1,
                    parseInt(match[6])
                );
                console.log('    완전한 기간 파싱 성공');
                break;
            }
        }

        // 진행중인 경우 매칭 시도
        if (!startDate) {
            for (const pattern of ongoingPatterns) {
                const match = period.match(pattern);
                if (match) {
                    startDate = new Date(
                        parseInt(match[1]),
                        parseInt(match[2]) - 1,
                        parseInt(match[3])
                    );
                    endDate = new Date(); // 현재
                    console.log('    진행중 기간 파싱 성공');
                    break;
                }
            }
        }

        if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error('    날짜 파싱 실패');
            return { startDate: null, endDate: null, totalDays: 0 };
        }

        const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        return { startDate, endDate, totalDays };
    }

    // 휴직 여부 판단
    isLeaveRecord(appointmentType) {
        console.log(`    휴직 여부 검사: "${appointmentType}"`);

        // 1단계: 휴직복직은 절대 휴직이 아님
        if (appointmentType.includes('휴직복직')) {
            console.log('    → 휴직복직 감지 - 휴직 아님');
            return false;
        }

        // 2단계: 전보는 휴직이 아님
        const transferKeywords = ['교육청간', '교육청내', '부처간', '부처내', '전보'];
        for (const keyword of transferKeywords) {
            if (appointmentType.includes(keyword)) {
                console.log(`    → 전보 키워드 감지 (${keyword}) - 휴직 아님`);
                return false;
            }
        }

        // 3단계: 휴직 키워드 검사
        const leaveKeywords = [
            '휴직', '육아휴직', '7호:육아휴직', '7호:육아', '질병휴직', 
            '유학휴직', '병역휴직', '가족돌봄휴직', '휴직연장', '노조전임', '연수휴직'
        ];

        for (const keyword of leaveKeywords) {
            if (appointmentType.includes(keyword)) {
                console.log(`    휴직 키워드 매칭: "${keyword}" - 휴직으로 분류`);
                return true;
            }
        }

        console.log('    → 휴직 키워드 없음 - 일반근무로 분류');
        return false;
    }

    // 제외할 레코드 판단
    isSkipRecord(appointmentType) {
        const skipKeywords = [
            '휴직복직', '교육청간', '교육청내', '부처간', '부처내', '전보'
        ];

        for (const keyword of skipKeywords) {
            if (appointmentType.includes(keyword)) {
                console.log(`    → 제외 키워드 감지: "${keyword}"`);
                return true;
            }
        }

        return false;
    }

    // 제외 이유 반환
    getSkipReason(appointmentType) {
        if (appointmentType.includes('휴직복직')) return '휴직복직';
        if (appointmentType.includes('교육청간') || appointmentType.includes('부처간')) return '교육청간 전보';
        if (appointmentType.includes('교육청내') || appointmentType.includes('부처내')) return '교육청내 전보';
        if (appointmentType.includes('전보')) return '전보';
        return '기타 제외';
    }

    // 휴직 유형 감지
    detectLeaveType(appointmentType) {
        console.log(`    휴직 유형 감지: "${appointmentType}"`);

        if (appointmentType.includes('육아') || appointmentType.includes('7호')) {
            console.log('    → 육아휴직');
            return 'parental';
        }
        if (appointmentType.includes('질병')) {
            console.log('    → 질병휴직');
            return 'sick';
        }
        if (appointmentType.includes('유학') || appointmentType.includes('연수')) {
            console.log('    → 유학휴직');
            return 'study';
        }
        if (appointmentType.includes('병역')) {
            console.log('    → 병역휴직');
            return 'military';
        }
        if (appointmentType.includes('가족돌봄')) {
            console.log('    → 가족돌봄휴직');
            return 'family_care';
        }
        if (appointmentType.includes('노조')) {
            console.log('    → 노조전임자');
            return 'union_official';
        }
        if (appointmentType.includes('휴직연장')) {
            console.log('    → 휴직연장');
            return 'extension';
        }

        console.log('    → 기타휴직');
        return 'other';
    }

    // 지역 감지
    detectRegion(text) {
        const textLower = text.toLowerCase();

        for (const [region, keywords] of Object.entries(this.regionKeywordMap)) {
            if (keywords.some(keyword => textLower.includes(keyword.toLowerCase()))) {
                return region;
            }
        }

        return 'other';
    }

    // 학교명 추출
    extractSchoolName(assignment) {
        const match = assignment.match(/(\S*[초중고등]학교)/);
        return match ? match[1] : assignment.substring(0, 20) + '...';
    }

    // 샘플 데이터 복사
    copySampleData() {
        const sampleData = document.getElementById('sample-data');
        if (sampleData) {
            sampleData.select();
            document.execCommand('copy');

            const btn = document.getElementById('copy-sample-btn');
            const originalText = btn.textContent;
            btn.textContent = '복사 완료!';
            btn.style.background = '#059669';
            btn.style.color = 'white';

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.style.color = '';
            }, 2000);
        }
    }

    // 자동 파싱 모달 표시
    showAutoParseModal() {
        console.log('자동 파싱 모달 표시');
        const modal = document.getElementById('auto-parse-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.showStep(1);

            setTimeout(() => {
                const textarea = document.getElementById('career-data-input');
                if (textarea) {
                    textarea.focus();
                }
            }, 100);
        }
    }

    // 자동 파싱 모달 숨기기
    hideAutoParseModal() {
        const modal = document.getElementById('auto-parse-modal');
        if (modal) {
            modal.classList.add('hidden');

            const textarea = document.getElementById('career-data-input');
            if (textarea) {
                textarea.value = '';
            }

            this.parsedData = null;
        }
    }

    // 단계 표시
    showStep(stepNumber) {
        for (let i = 1; i <= 3; i++) {
            const stepContent = document.getElementById(`step-${i}`);
            const stepIndicator = document.querySelector(`[data-step="${i}"]`);

            if (stepContent) {
                stepContent.style.display = i === stepNumber ? 'block' : 'none';
            }

            if (stepIndicator) {
                stepIndicator.classList.toggle('step--active', i === stepNumber);
            }
        }
    }

    // 입력 데이터 파싱
    parseInputData() {
        const textarea = document.getElementById('career-data-input');
        if (!textarea) return;

        const inputData = textarea.value.trim();
        if (!inputData) {
            alert('데이터를 입력해주세요.');
            return;
        }

        console.log('\n입력 데이터 파싱 시작');

        try {
            this.parsedData = this.parseCareerData(inputData);
            this.displayParseResults();
            this.showStep(2);
        } catch (error) {
            console.error('파싱 오류:', error);
            alert('데이터 파싱 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // 파싱 결과 표시
    displayParseResults() {
        if (!this.parsedData) return;

        const resultsDiv = document.getElementById('parse-results');
        if (!resultsDiv) return;

        const { schools, leaves, skipped, errors, summary } = this.parsedData;

        let html = '';

        // 요약 정보
        html += `
            <div class="alert alert-info">
                <h4>파싱 결과 요약</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem;">
                    <div>일반 근무: <strong>${summary.schoolCount}개</strong></div>
                    <div>휴직: <strong>${summary.leaveCount}개</strong></div>
                    <div>제외된 항목: <strong>${summary.skippedCount}개</strong></div>
                    <div>오류: <strong>${summary.errorCount}개</strong></div>
                </div>
            </div>
        `;

        // 일반 근무
        if (schools.length > 0) {
            html += '<div class="parse-section parse-section--schools">';
            html += '<h4>일반 근무 경력</h4>';
            html += '<ul class="parse-list">';
            schools.forEach(school => {
                html += `
                    <li class="parse-item">
                        <strong>${school.name}</strong> (${this.regionalSettings[school.region].name})
                        <div class="parse-meta">
                            ${this.formatDate(school.startDate)} ~ ${this.formatDate(school.endDate)} 
                            (${school.totalDays}일, ${school.appointmentType})
                        </div>
                    </li>
                `;
            });
            html += '</ul></div>';
        }

        // 휴직
        if (leaves.length > 0) {
            html += '<div class="parse-section parse-section--leaves">';
            html += '<h4>휴직 정보</h4>';
            html += '<ul class="parse-list">';
            leaves.forEach(leave => {
                const effect = leave.isOneYearOrMore ? '학교만기 제외' : '학교만기 포함';
                const effectColor = leave.isOneYearOrMore ? '#dc2626' : '#059669';
                html += `
                    <li class="parse-item">
                        <strong>${this.leaveTypes[leave.type].label}</strong>
                        <div class="parse-meta">
                            ${this.formatDate(leave.startDate)} ~ ${this.formatDate(leave.endDate)} 
                            (${leave.totalDays}일, <span style="color: ${effectColor}; font-weight: bold;">${effect}</span>)
                            <br><small style="color: #666;">원본: ${leave.appointmentType}</small>
                        </div>
                    </li>
                `;
            });
            html += '</ul></div>';
        }

        // 제외된 항목
        if (skipped.length > 0) {
            html += '<div class="parse-section parse-section--skipped">';
            html += '<h4>제외된 항목</h4>';
            html += '<ul class="parse-list">';
            skipped.forEach(skip => {
                html += `
                    <li class="parse-item">
                        <span style="color: #dc2626;">[${skip.reason}]</span> ${skip.appointmentType}
                        <div class="parse-meta">라인 ${skip.lineNumber}: ${skip.period || skip.line}</div>
                    </li>
                `;
            });
            html += '</ul></div>';
        }

        // 오류
        if (errors.length > 0) {
            html += '<div class="parse-section parse-section--errors">';
            html += '<h4>오류</h4>';
            html += '<ul class="parse-list">';
            errors.forEach(error => {
                html += `<li class="parse-item" style="color: #dc2626;">${error}</li>`;
            });
            html += '</ul></div>';
        }

        resultsDiv.innerHTML = html;
    }

    // 파싱된 데이터 확정
    confirmParsedData() {
        if (!this.parsedData) return;

        const { schools, leaves } = this.parsedData;

        // 기존 데이터에 추가
        this.schools = [...this.schools, ...schools];
        this.leaves = [...this.leaves, ...leaves];

        // 성공 메시지 표시
        const summaryDiv = document.getElementById('registration-summary');
        if (summaryDiv) {
            summaryDiv.innerHTML = `
                <div style="background: #d1fae5; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <div>일반 근무: <strong>${schools.length}개</strong> 등록</div>
                    <div>휴직: <strong>${leaves.length}개</strong> 등록</div>
                    <div>총 데이터: <strong>${this.schools.length + this.leaves.length}개</strong></div>
                </div>
                <p>만기 계산 결과를 확인하세요.</p>
            `;
        }

        this.showStep(3);
        this.updateUI();
        this.calculateExpiry();
    }

    // UI 업데이트
    updateUI() {
        this.updateDataSummary();
        this.updateDataList();
        this.updateCalculationStatus();
    }

    // 데이터 요약 업데이트
    updateDataSummary() {
        const schoolCountEl = document.getElementById('school-count');
        const leaveCountEl = document.getElementById('leave-count');
        const totalPeriodEl = document.getElementById('total-period');

        if (schoolCountEl) schoolCountEl.textContent = `${this.schools.length}개`;
        if (leaveCountEl) leaveCountEl.textContent = `${this.leaves.length}개`;

        // 총 기간 계산 (대략적)
        if (totalPeriodEl) {
            const totalDays = [...this.schools, ...this.leaves].reduce((sum, item) => sum + item.totalDays, 0);
            const years = Math.floor(totalDays / 365);
            totalPeriodEl.textContent = `약 ${years}년`;
        }
    }

    // 데이터 리스트 업데이트
    updateDataList() {
        const listEl = document.getElementById('registered-data-list');
        if (!listEl) return;

        if (this.schools.length === 0 && this.leaves.length === 0) {
            listEl.innerHTML = '<p class="text-secondary">등록된 데이터가 없습니다. 자동 등록을 시작해보세요.</p>';
            return;
        }

        let html = '';

        // 일반 근무 표시
        this.schools.forEach((school, index) => {
            html += `
                <div class="data-item data-item--school">
                    <div class="data-info">
                        <h5>🏫 ${school.name}</h5>
                        <div class="data-meta">${this.regionalSettings[school.region].name} | ${school.appointmentType}</div>
                        <div class="data-period">${this.formatDate(school.startDate)} ~ ${this.formatDate(school.endDate)} (${this.formatDuration(school.totalDays)})</div>
                    </div>
                    <div class="data-actions">
                        <button class="btn-icon" onclick="calculator.removeSchool(${index})" title="삭제">×</button>
                    </div>
                </div>
            `;
        });

        // 휴직 표시
        this.leaves.forEach((leave, index) => {
            const leaveType = this.leaveTypes[leave.type];
            const oneYearClass = leave.isOneYearOrMore ? ' one-year-plus' : '';
            const effect = leave.isOneYearOrMore ? '학교만기 제외' : '학교만기 포함';

            html += `
                <div class="data-item data-item--leave${oneYearClass}">
                    <div class="data-info">
                        <h5>🟡 ${leaveType.label}</h5>
                        <div class="data-meta">${leave.appointmentType} | ${effect}</div>
                        <div class="data-period">${this.formatDate(leave.startDate)} ~ ${this.formatDate(leave.endDate)} (${this.formatDuration(leave.totalDays)})</div>
                    </div>
                    <div class="data-actions">
                        <button class="btn-icon" onclick="calculator.removeLeave(${index})" title="삭제">×</button>
                    </div>
                </div>
            `;
        });

        listEl.innerHTML = html;
    }

    // 계산 상태 업데이트
    updateCalculationStatus() {
        const statusEl = document.getElementById('calculation-status');
        if (!statusEl) return;

        if (!this.currentRegion || !this.currentTransferDate) {
            statusEl.innerHTML = '현임교 정보(지역, 전입일자)를 입력한 후 만기를 계산할 수 있습니다.';
            statusEl.className = 'alert alert-warning';
        } else if (this.schools.length === 0 && this.leaves.length === 0) {
            statusEl.innerHTML = '경력 데이터를 등록한 후 만기를 계산할 수 있습니다.';
            statusEl.className = 'alert alert-info';
        } else {
            statusEl.innerHTML = '만기 계산이 가능합니다. 계산 버튼을 눌러주세요.';
            statusEl.className = 'alert alert-success';
        }
    }

    // 🔧 완전 수정된 만기 계산 로직
    calculateExpiry() {
        if (!this.currentRegion || !this.currentTransferDate) {
            console.log('만기 계산 불가: 현임교 정보 부족');
            return;
        }

        console.log('=== 🔧 수정된 만기 계산 시작 ===');
        console.log('현임교 전입일자:', this.formatDate(this.currentTransferDate));

        const today = new Date();
        const regionData = this.regionalSettings[this.currentRegion];

        // ⭐️ 학교 만기 계산: 현임교 기간 중 1년이상 휴직만 적용
        const oneYearPlusLeaveDays = this.leaves
            .filter(leave => {
                // 현임교 전입일 이후의 휴직만 학교만기에 영향
                const isAfterTransfer = leave.startDate >= this.currentTransferDate;
                return leave.isOneYearOrMore && isAfterTransfer;
            })
            .reduce((sum, leave) => sum + leave.totalDays, 0);

        console.log('학교 만기 계산 상세:');
        console.log('- 전입일자:', this.formatDate(this.currentTransferDate));
        console.log('- 기본 임용기간:', regionData.schoolTerm + '년');
        console.log('- 1년 이상 휴직일수:', oneYearPlusLeaveDays);

        // 학교 만기일 = 전입일자 + 5년 + 1년이상휴직일수
        const schoolExpiryDate = new Date(this.currentTransferDate);
        schoolExpiryDate.setFullYear(schoolExpiryDate.getFullYear() + regionData.schoolTerm);
        schoolExpiryDate.setDate(schoolExpiryDate.getDate() + oneYearPlusLeaveDays);

        // 현재까지 유효 근무일수
        const currentDays = Math.floor((today - this.currentTransferDate) / (1000 * 60 * 60 * 24)) + 1;
        const schoolEffectiveDays = currentDays - oneYearPlusLeaveDays;
        const schoolRemainingDays = Math.max(0, Math.floor((schoolExpiryDate - today) / (1000 * 60 * 60 * 24)));

        console.log('- 현재 총 재직일수:', currentDays);
        console.log('- 유효 근무일수:', schoolEffectiveDays);
        console.log('- 계산된 학교만기일:', this.formatDate(schoolExpiryDate));
        console.log('- 남은 일수:', schoolRemainingDays);

        // 지역 만기 계산 (전체 경력)
        let regionalTotalDays = currentDays;

        // 전임교 같은 지역 경력 추가
        this.schools
            .filter(school => school.region === this.currentRegion)
            .forEach(school => {
                regionalTotalDays += school.totalDays;
                console.log(`전임교 경력 추가: ${school.name} (${school.totalDays}일)`);
            });

        // 지역 만기용 휴직 제외 (includedInService가 false인 것만)
        const regionalExcludedLeaveDays = this.leaves
            .filter(leave => !this.leaveTypes[leave.type].includedInService)
            .reduce((sum, leave) => sum + leave.totalDays, 0);

        console.log('지역 만기 계산 상세:');
        console.log('- 현임교 근무일수:', currentDays);
        console.log('- 전임교 경력 총합:', regionalTotalDays - currentDays);
        console.log('- 지역만기용 제외 휴직일수:', regionalExcludedLeaveDays);

        const regionalEffectiveDays = regionalTotalDays - regionalExcludedLeaveDays;
        const regionalTermDays = regionData.regionalTerm * 365;
        const regionalRemainingDays = Math.max(0, regionalTermDays - regionalEffectiveDays);
        const regionalExpiryDate = new Date(today.getTime() + regionalRemainingDays * 24 * 60 * 60 * 1000);

        console.log('- 지역 유효 근무일수:', regionalEffectiveDays);
        console.log('- 지역 만기일:', this.formatDate(regionalExpiryDate));

        // 결과 표시
        this.displayCalculationResults({
            school: {
                expiryDate: schoolExpiryDate,
                remainingDays: schoolRemainingDays,
                effectiveDays: schoolEffectiveDays
            },
            regional: {
                expiryDate: regionalExpiryDate,
                remainingDays: regionalRemainingDays,
                effectiveDays: regionalEffectiveDays
            }
        });

        console.log('=== ✅ 만기 계산 완료 ===');
    }

    // 계산 결과 표시
    displayCalculationResults(results) {
        // 결과 표시 영역 보이기
        const resultsEl = document.getElementById('calculation-results');
        const statusEl = document.getElementById('calculation-status');

        if (resultsEl) resultsEl.style.display = 'block';
        if (statusEl) statusEl.style.display = 'none';

        // 학교 만기
        const schoolExpiryEl = document.getElementById('school-expiry-date');
        const schoolRemainingEl = document.getElementById('school-remaining');
        const schoolEffectiveEl = document.getElementById('school-effective-service');

        if (schoolExpiryEl) schoolExpiryEl.textContent = this.formatDate(results.school.expiryDate);
        if (schoolRemainingEl) schoolRemainingEl.textContent = this.formatRemainingPeriod(results.school.remainingDays);
        if (schoolEffectiveEl) schoolEffectiveEl.textContent = this.formatDuration(results.school.effectiveDays);

        // 지역 만기
        const regionalExpiryEl = document.getElementById('regional-expiry-date');
        const regionalRemainingEl = document.getElementById('regional-remaining');
        const regionalTotalEl = document.getElementById('regional-total-service');

        if (regionalExpiryEl) regionalExpiryEl.textContent = this.formatDate(results.regional.expiryDate);
        if (regionalRemainingEl) regionalRemainingEl.textContent = this.formatRemainingPeriod(results.regional.remainingDays);
        if (regionalTotalEl) regionalTotalEl.textContent = this.formatDuration(results.regional.effectiveDays);

        // 휴직 영향 분석
        this.displayLeaveImpact();
    }

    // 휴직 영향 표시
    displayLeaveImpact() {
        const impactEl = document.getElementById('leave-impact');
        const contentEl = document.getElementById('leave-impact-content');

        if (!impactEl || !contentEl || this.leaves.length === 0) {
            if (impactEl) impactEl.style.display = 'none';
            return;
        }

        let html = '<div style="display: grid; gap: 1rem;">';

        this.leaves.forEach(leave => {
            const leaveType = this.leaveTypes[leave.type];
            const schoolEffect = leave.isOneYearOrMore ? '제외됨' : '포함됨';
            const regionalEffect = leaveType.includedInService ? '포함됨' : '제외됨';

            html += `
                <div style="background: white; padding: 1rem; border-radius: 6px; border-left: 4px solid ${leaveType.color};">
                    <div style="font-weight: bold; margin-bottom: 0.5rem;">${leaveType.label}</div>
                    <div style="font-size: 0.9em; color: #666;">
                        ${this.formatDate(leave.startDate)} ~ ${this.formatDate(leave.endDate)} (${this.formatDuration(leave.totalDays)})
                    </div>
                    <div style="margin-top: 0.5rem; font-size: 0.85em;">
                        학교만기: <span style="color: ${leave.isOneYearOrMore ? '#dc2626' : '#059669'};">${schoolEffect}</span> | 
                        지역만기: <span style="color: ${leaveType.includedInService ? '#059669' : '#dc2626'};">${regionalEffect}</span>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        contentEl.innerHTML = html;
        impactEl.style.display = 'block';
    }

    // 데이터 삭제 함수들
    removeSchool(index) {
        if (confirm('이 경력을 삭제하시겠습니까?')) {
            this.schools.splice(index, 1);
            this.updateUI();
            this.calculateExpiry();
        }
    }

    removeLeave(index) {
        if (confirm('이 휴직을 삭제하시겠습니까?')) {
            this.leaves.splice(index, 1);
            this.updateUI();
            this.calculateExpiry();
        }
    }

    clearAllData() {
        if (confirm('모든 등록된 데이터를 삭제하시겠습니까?')) {
            this.schools = [];
            this.leaves = [];
            this.updateUI();

            const resultsEl = document.getElementById('calculation-results');
            const statusEl = document.getElementById('calculation-status');

            if (resultsEl) resultsEl.style.display = 'none';
            if (statusEl) statusEl.style.display = 'block';
        }
    }

    // 수동 추가 모달 (간단 구현)
    showManualModal() {
        alert('수동 추가 기능은 추후 구현 예정입니다. 현재는 자동 등록을 이용해주세요.');
    }

    // 유틸리티 함수들
    formatDate(date) {
        if (!date) return '-';
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    formatDuration(days) {
        if (!days || days <= 0) return '0일';

        const years = Math.floor(days / 365);
        const remainingDays = days % 365;
        const months = Math.floor(remainingDays / 30);
        const finalDays = remainingDays % 30;

        const parts = [];
        if (years > 0) parts.push(`${years}년`);
        if (months > 0) parts.push(`${months}개월`);
        if (finalDays > 0 && years === 0) parts.push(`${finalDays}일`);

        return parts.join(' ') || '0일';
    }

    formatRemainingPeriod(days) {
        if (days <= 0) return '만기 도래';

        const years = Math.floor(days / 365);
        const months = Math.floor((days % 365) / 30);

        if (years > 0) {
            return months > 0 ? `${years}년 ${months}개월` : `${years}년`;
        } else {
            return `${months}개월`;
        }
    }
}

// 전역 변수로 계산기 인스턴스 생성
let calculator;

// DOM 로드 완료시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 만기계산 오류 해결된 경력계산기 초기화');
    calculator = new CareerCalculator();
});

console.log('✅ 만기계산 오류 완전 해결된 경력계산기 스크립트 로드 완료');