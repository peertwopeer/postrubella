export default `<div>
    
    <%if((typeof logo !== 'undefined') && (logo!=="")){%>
    <div style="margin-bottom:20px"><img src="<%- logo %>"/></div>
    <%}else{%>
    <div style="margin-bottom:20px"><img width="300" height="80" alt="logo" src="https://postrubella.ams3.digitaloceanspaces.com/public/img/logo_large.png"/></div>
    <%}%>
    <div style="margin-bottom:20px; font-weight:bold;">Urgent notice</div>



    <div style="margin-bottom:10px; border-bottom:2px solid #000; padding-bottom: 30px">

        <p>The postrubella team attempted to deliver your post today at <%- next_time %> hrs</p>
        <p>We are sorry we missed you, your post has now been returned to the postrubella!</p>

    </div>

    <div style="margin-bottom:20px">Yours sincerely,<br/>The postrubella Team.</div>

    <p style="margin-bottom:30px; margin-bottom : 20px; font-size : 11px;"><b>Note:</b> This is an auto generated email, please do not reply.</p>

</div>`;
