const fs = require('fs')
const {app} = require('electron').remote
const path = require('path')
const Chart = require('chart.js')

if(!fs.existsSync(path.join(app.getPath('userData'), 'statistics'))) fs.writeFileSync(path.join(app.getPath('userData'), 'statistics'), '')

const stats = fs.existsSync(path.join(app.getPath('userData'), 'statistics')) ? fs.readFileSync(path.join(app.getPath('userData'), 'statistics'), {
    encoding: 'utf-8'
}) : ''

if(stats === '') {
    document.getElementById('no_data').classList.toggle('hidden')
}

const ctx = document.getElementById('canvas').getContext('2d')
const chart = new Chart(ctx, {
    type: 'pie',
    data: {
        labels: ['took', 'skipped', 'postponed'],
        datasets: [
            {
                backgroundColor: [
                    'green',
                    'red',
                    'orange'
                ],
                data: (() => {
                    var took = 0
                    var skipped = 0
                    var postponed = 0
        
                    const points = stats.split(';')
            
                    for(var i = 0; i < points.length; i++) {
                        const point = points[i]
            
                        const date = new Date(point.split('_')[0])
                        const type = point.split('_')[1]
        
                        if(type === 'break') {
                            took++
                        }else if(type === 'skip') {
                            skipped++
                        }else if(type === 'postpone') {
                            postponed++
                        }
                    }
        
                    return [took, skipped, postponed]
                })()
            }
        ]
    }
})