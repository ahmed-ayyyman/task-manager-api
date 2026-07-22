import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
    url: "http://localhost:8080",
    realm: "CompanyRealm",
    clientId: "company-client"
});


export default keycloak;

console.log(keycloak.token);
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: document.getElementById("email").value,
            password: document.getElementById("password").value
        })
    });

    const data = await response.json();

    console.log(data);
});
document.getElementById("logoutBtn").onclick = () => {
    keycloak.logout();
};
