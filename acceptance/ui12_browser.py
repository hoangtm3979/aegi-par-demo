import os,time,base64
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

base=os.environ['BASE_URL'].rstrip('/')
os.makedirs('/tmp/aegi-ui12',exist_ok=True)
png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAYUlEQVR4nO3PQQ0AIBDAMMC/2JOACB4Nyapg2zOzfnZ0wKsGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAv3PQNQLlLzTgAAAABJRU5ErkJggg==')
open('/tmp/aegi-ui12/pixel.png','wb').write(png)
o=Options();o.add_argument('--headless=new');o.add_argument('--no-sandbox');o.add_argument('--disable-dev-shm-usage');o.add_argument('--window-size=390,844')
d=webdriver.Chrome(options=o);w=WebDriverWait(d,20)
try:
    d.set_window_size(390,844); d.get(base+'/')
    w.until(lambda x:'UI 1.2' in x.find_element(By.CSS_SELECTOR,'.brand small').text)
    assert len(d.find_elements(By.CSS_SELECTOR,'[data-entry]'))==2
    assert not d.find_elements(By.CSS_SELECTOR,'[data-entry="quick"]')
    details=d.find_element(By.ID,'aboutPrototype'); d.execute_script('arguments[0].open=true',details)
    text=details.text
    for marker in ('90/90','47/47','6/6','3/3','0/22','Học có kiểm soát'): assert marker in text,marker
    assert not d.execute_script('return document.documentElement.scrollWidth > window.innerWidth + 1')
    d.save_screenshot('/tmp/aegi-ui12/01_home_mobile.png')

    w.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR,'.load-profile')))[0].click()
    w.until(EC.visibility_of_element_located((By.ID,'checkForm')))
    assert d.find_element(By.ID,'credentialExposure') and d.find_element(By.ID,'controlExposure')
    d.find_element(By.ID,'evidenceFile').send_keys('/tmp/aegi-ui12/pixel.png')
    w.until(lambda x:'Đã nhận tệp' in x.find_element(By.ID,'uploadStatus').text or 'Đã đọc' in x.find_element(By.ID,'uploadStatus').text)
    up=d.find_element(By.ID,'uploadStatus').text.lower(); assert 'chưa đọc' in up or 'qr' in up
    d.find_element(By.CSS_SELECTOR,'#checkForm button[type="submit"]').click()
    w.until(EC.visibility_of_element_located((By.CSS_SELECTOR,'#result.active')))
    d.set_window_size(1280,1000); d.save_screenshot('/tmp/aegi-ui12/02_flow1_result.png')
    action_text=d.find_element(By.CSS_SELECTOR,'.action-priority').text
    verify_text=d.find_element(By.CSS_SELECTOR,'.verification-primary').text
    print('ACTION_PRIORITY_TEXT=',repr(action_text)); print('VERIFY_PRIMARY_TEXT=',repr(verify_text))
    print('ACTION_OUTER_HTML=',d.find_element(By.CSS_SELECTOR,'.action-priority').get_attribute('outerHTML')[:1200])
    assert 'LÀM GÌ NGAY' in action_text.upper()
    assert 'XÁC MINH / XỬ LÝ TIẾP THEO' in verify_text.upper()
    case_id=d.execute_script("return localStorage.getItem('aegi_par_p3_last_case')"); assert case_id

    d.find_element(By.ID,'showEvidence').click(); w.until(lambda x:x.find_element(By.ID,'evidenceDialog').get_attribute('open') is not None)
    adverse=[x.text for x in d.find_elements(By.CSS_SELECTOR,'.state-adverse')]; assert any('KHỚP CẢNH BÁO' in x.upper() for x in adverse),adverse
    d.save_screenshot('/tmp/aegi-ui12/03_flow1_evidence.png'); d.find_element(By.ID,'closeEvidence').click()

    d.execute_script("window.__ui12OrigFetch=window.fetch; window.fetch=(u,o={})=>{if((o.method||'GET')==='DELETE')return Promise.resolve(new Response('{}',{status:503,headers:{'Content-Type':'application/json'}}));return window.__ui12OrigFetch(u,o)}")
    d.find_element(By.ID,'deleteCase').click(); w.until(lambda x:not x.find_element(By.ID,'resultStatus').get_attribute('hidden'))
    assert 'chưa xóa được' in d.find_element(By.ID,'resultStatus').text.lower()
    assert d.execute_script("return localStorage.getItem('aegi_par_p3_last_case')")==case_id
    d.execute_script('window.fetch=window.__ui12OrigFetch')
    d.find_element(By.ID,'deleteCase').click(); w.until(EC.visibility_of_element_located((By.CSS_SELECTOR,'#home.active')))
    assert d.execute_script("return localStorage.getItem('aegi_par_p3_last_case')") is None

    w.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR,'.load-profile')))[0].click(); w.until(EC.visibility_of_element_located((By.ID,'checkForm')))
    assert d.find_element(By.ID,'situation').get_attribute('value')
    d.find_element(By.CSS_SELECTOR,'#intake [data-back]').click(); w.until(EC.visibility_of_element_located((By.CSS_SELECTOR,'#home.active')))
    d.find_element(By.CSS_SELECTOR,'[data-entry="recovery"]').click(); w.until(EC.visibility_of_element_located((By.CSS_SELECTOR,'#intake.active')))
    assert d.find_element(By.ID,'situation').get_attribute('value')==''
    assert d.find_element(By.ID,'phone').get_attribute('value')=='' and d.find_element(By.ID,'account').get_attribute('value')==''
    assert d.find_element(By.ID,'actionState').get_attribute('value')=='UNKNOWN'
    assert d.find_element(By.ID,'credentialExposure').get_attribute('value')=='UNKNOWN'
    assert d.find_element(By.ID,'controlExposure').get_attribute('value')=='UNKNOWN'
    assert d.execute_script('return document.activeElement.tagName')=='H2'

    d.find_element(By.ID,'situation').send_keys('Một yêu cầu đáng ngờ cần kiểm tra')
    d.execute_script("window.__ui12OrigFetch2=window.fetch; window.fetch=(u,o={})=>{if(String(u).includes('/api/v1/check'))return new Promise((resolve,reject)=>{const t=setTimeout(()=>window.__ui12OrigFetch2(u,o).then(resolve,reject),1500);if(o.signal)o.signal.addEventListener('abort',()=>{clearTimeout(t);reject(new DOMException('Aborted','AbortError'))})});return window.__ui12OrigFetch2(u,o)}")
    d.find_element(By.CSS_SELECTOR,'#checkForm button[type="submit"]').click(); time.sleep(.15)
    d.find_element(By.CSS_SELECTOR,'#intake [data-back]').click(); w.until(EC.visibility_of_element_located((By.CSS_SELECTOR,'#home.active')))
    d.find_element(By.CSS_SELECTOR,'[data-entry="situation"]').click(); w.until(EC.visibility_of_element_located((By.CSS_SELECTOR,'#intake.active')))
    time.sleep(2.0)
    assert 'active' in d.find_element(By.ID,'intake').get_attribute('class')
    assert d.find_element(By.ID,'situation').get_attribute('value')==''
    d.execute_script('window.fetch=window.__ui12OrigFetch2')
    d.set_window_size(390,844); d.save_screenshot('/tmp/aegi-ui12/04_intake_mobile.png')
    print('BROWSER_ACCEPTANCE=PASS')
finally:
    d.quit()
