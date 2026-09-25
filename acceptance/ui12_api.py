import json, os, urllib.request, urllib.error
base=os.environ['BASE_URL'].rstrip('/')
created=[]

def req(path,method='GET',payload=None,expected=(200,)):
    data=None; headers={'User-Agent':'AEGI-PAR-UI12-acceptance/1.0'}
    if payload is not None:
        data=json.dumps(payload,ensure_ascii=False).encode(); headers['Content-Type']='application/json'
    r=urllib.request.Request(base+path,data=data,headers=headers,method=method)
    try:
        with urllib.request.urlopen(r,timeout=25) as x: status=x.status; body=x.read()
    except urllib.error.HTTPError as e: status=e.code; body=e.read()
    print(method,path,status)
    assert status in expected,(path,status,body[:500])
    return status,body

try:
    _,b=req('/api/v1/readyz'); ready=json.loads(b); assert ready['ready'] is True; assert ready['release']=='PAR-DEMO-P3-v0.4.2-rc4'
    _,b=req('/api/v1/health'); health=json.loads(b); assert health['status']=='ok'; assert health['release']=='PAR-DEMO-P3-v0.4.2-rc4'
    _,b=req('/'); home=b.decode(); assert '/static/ui12_patch.js' in home and '/static/ui12.css' in home
    _,b=req('/static/ui12_patch.js'); patch=b.decode()
    for marker in ['UI 1.2','90/90','0/22 nhóm đủ điều kiện','state-adverse','credentialExposure','controlExposure']:
        assert marker in patch,marker
    req('/static/ui12.css')
    _,b=req('/api/v1/demo/profiles'); ps={p['id']:p for p in json.loads(b)['profiles']}
    f1=ps['hero1_unknown_identifier']; f2=ps['hero2_legitimate_unfamiliar']
    f3={'situation':'Tôi đã chuyển 25 triệu đồng theo yêu cầu của người gọi tự xưng cán bộ điều tra và họ yêu cầu tôi giữ bí mật. Sau đó tôi phát hiện tài khoản nhận không đúng thông tin mà họ nói. Tôi cần biết phải làm gì ngay.','phone':'0900000404','account':'666600001111222233','action_state':'ALREADY_TRANSFERRED'}
    for label,src,action in [('FLOW1',f1,'PREVENT_VERIFY'),('FLOW2',f2,'VERIFY_LIGHT'),('FLOW3',f3,'RECOVER')]:
        payload={'situation':src['situation'],'phone':src.get('phone'),'account':src.get('account'),'action_state':src.get('action_state','UNKNOWN'),'attachment_tokens':[],'exposure_answers':{'payment':'UNKNOWN','credential':'UNKNOWN','control':'UNKNOWN'}}
        _,b=req('/api/v1/check','POST',payload); out=json.loads(b); created.append(out['case_id']); assert out['action_class']==action,(label,out['action_class'])
        for key in ('actions','reasons','unknowns','verification_steps','trace'): assert out.get(key),(label,key)
        _,eb=req(f"/api/v1/cases/{out['case_id']}/evidence"); ev=json.loads(eb); assert ev['case_id']==out['case_id']
        if label=='FLOW1': assert any(e['kind']=='OFFICIAL_SCENARIO_WARNING' and e['state']=='MATCH' for e in ev['evidence'])
        print(label,action,'PASS')
    extra={'situation':'Tôi chưa chuyển tiền nhưng đã đọc mã OTP cho người gọi tự xưng nhân viên hỗ trợ. Tôi cần biết phải làm gì ngay.','phone':'0900000555','account':None,'action_state':'NOT_STARTED','attachment_tokens':[],'exposure_answers':{'payment':'NO','credential':'YES','control':'NO'}}
    _,b=req('/api/v1/check','POST',extra); out=json.loads(b); created.append(out['case_id']); assert out['action_class']=='RECOVER',out['action_class']; print('CREDENTIAL_ONLY_RECOVERY=PASS')
    print('API_ACCEPTANCE=PASS')
finally:
    for cid in created:
        try:
            req(f'/api/v1/cases/{cid}','DELETE',expected=(200,)); req(f'/api/v1/cases/{cid}',expected=(404,))
        except Exception as e: print('cleanup warning',cid,e)
