import https from 'https';

const urls = [
    "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?q=80&w=200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1530785602389-07594beb8b73?q=80&w=200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1620012253295-c15bc3e6554c?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1515347619253-abbed38a4cd7?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1583391733958-d20531e115ae?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550614000-4b95dd2db85a?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?q=80&w=600&auto=format&fit=crop"
];

async function checkUrl(urlStr) {
    return new Promise((resolve) => {
        https.get(urlStr, (res) => {
            resolve({ url: urlStr, status: res.statusCode });
        }).on('error', (e) => {
            resolve({ url: urlStr, status: e.message });
        });
    });
}

async function main() {
    for (const url of urls) {
        const res = await checkUrl(url);
        console.log(`${res.status} - ${res.url}`);
    }
}

main();
