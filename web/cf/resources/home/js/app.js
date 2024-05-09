// return a random number between 'min' and 'max'
function uniform(min, max) {
    return Math.random() * (max - min) + min;
}
document.onreadystatechange = function () {
    if (document.readyState === "complete") {
        // set 'Connection' configuration
        const address = '<Connection alias="PLC" address="{hostname}" port="443" />';
        document.getElementById("connection").textContent = address.replace('{hostname}', location.hostname);

        // set background image for header
        const height = document.getElementById('header').offsetHeight;
        const width = document.getElementById('header').offsetWidth;
        function uniformx (min, max) { return uniform(min, max) * width; }
        function uniformy (min, max) { return uniform(min, max) * height; }
        const rand = Math.round(Math.random()); // 0/1
        /**
         * Implementation Notes of Background Image:
         * The backgroundImage includes two ellipses, which are generated with random parameters.
         * They have some intersection region by rotating different degrees.
         */
        let svg = "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='100%' height='100%'>" +
        "<ellipse cx='{cx1}' cy='{cy1}' rx='{rx1}' ry='{ry1}' "+
            "transform='rotate({deg1},{rotx1},{roty1})' fill-opacity='0.035' fill='#fff' />" +
        "<ellipse cx='{cx2}' cy='{cy2}' rx='{rx2}' ry='{ry2}' "+
            "transform='rotate({deg2},{rotx2},{roty2})' fill-opacity='0.035' fill='#fff' /></svg>";
        svg = svg.replace('{cx1}',   uniformx(0.4, 0.6))
                .replace('{cy1}',   uniformy(0.8, 1))
                .replace('{rx1}',   uniformx(0.3, 0.4))
                .replace('{ry1}',   uniformy(0.3, 0.4))
                .replace('{deg1}',  uniform(20, 80) + 80 * rand)
                .replace('{rotx1}', uniformx(0.4, 0.6))
                .replace('{roty1}', uniformy(0.8, 1))
                .replace('{cx2}',   uniformx(0.45, 0.55))
                .replace('{cy2}',   uniformy(0.05, 0.15))
                .replace('{rx2}',   uniformx(0.2, 0.3))
                .replace('{ry2}',   uniformy(0.3, 0.4))
                .replace('{deg2}',  uniform(10, 30) + 140 * (1 - rand))
                .replace('{rotx2}', uniformx(0.45, 0.55))
                .replace('{roty2}', uniformy(0.05, 0.15));
        const url = 'data:image/svg+xml;base64,' + window.btoa(svg);
        document.getElementById("header").style.backgroundImage = "url('" + url + "')";
    }
}