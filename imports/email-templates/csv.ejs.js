export default `<div>

    <div style="margin-bottom:20px"><img width="300" height="80" alt="logo" src="https://postrubella.ams3.digitaloceanspaces.com/public/img/logo_large.png"/></div>
    <div style="margin-bottom:20px; font-weight:bold;">Your CSV Report is attached.</div>

    <div style="margin-bottom:2px"><span style="font-weight:bold; width: 75px">FROM: </span> <%- fromDate %></div>
    <div style="margin-bottom:5px"><span style="font-weight:bold; width: 75px">TO: </span> <%- toDate %></div>

    <div style="margin-bottom:10px; border-bottom:2px solid #000; padding-bottom: 30px">

        <%if (carrier) { %>
            <div style="margin-bottom:2px"><span style="font-weight:bold; width: 75px">Carrier: </span> <%- carrier %></div>
        <% } %>

        <%if (location) { %>
            <div style="margin-bottom:2px"><span style="font-weight:bold; width: 75px">Location: </span> <%- location %></div>
        <% } %>

        <%if (deliveryType) { %>
            <div style="margin-bottom:2px"><span style="font-weight:bold; width: 75px">Delivery Type: </span> <%- deliveryType %></div>
        <% } %>

        <%if (deliveryStatus) { %>
            <div style="margin-bottom:2px"><span style="font-weight:bold; width: 75px">Delivery Status: </span> <%- deliveryStatus %></div>
        <% } %>

        <%if (user) { %>
            <div style="margin-bottom:2px"><span style="font-weight:bold; width: 75px">Delivery User: </span> <%- user %></div>
        <% } %>

        <%if (itemType) { %>
            <div style="margin-bottom:2px"><span style="font-weight:bold; width: 75px">Item Type: </span> <%- itemType %></div>
        <% } %>

    </div>

    <div style="margin-bottom:20px">Yours sincerely,<br/>The postrubella Team.</div>

</div>`;
