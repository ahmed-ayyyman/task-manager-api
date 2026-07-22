import keycloak from "./keycloak.js";

keycloak.init({
    onLoad: "check-sso"
}).then((authenticated) => {
    console.log(authenticated);
    
});


