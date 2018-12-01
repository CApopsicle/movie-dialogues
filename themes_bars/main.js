var dataDir = '../data/'
var svg = d3.select('svg');

// Get layout parameters
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

// Global dataset
var moviesData;

var themesOfInterest = [
    // 'posemo',
    // 'negemo',
    'anx',
    'anger',
    'sad',
    'sexual',
    // 'work',
    'leisure',
    'home',
    'money',
    'relig',
    'death',
    // 'swear',
    // 'netspeak',
];
var genresOfInterest = [
    'drama',
    'thriller',
    'comedy',
    'action',
    'crime',
    'romance',
    'sci-fi',
    'adventure',
    'mystery',
    'horror',
    'fantasy',
    'war'
];

function decadeForRow(row) {
    return row.movie_year - row.movie_year % 10;
};

function filterMoviesByDecade(movies, decade) {
    var filteredMovies = movies.filter(function(m) {
        return decadeForRow(m) == decade;
    })
    return filteredMovies
}

function themeScoresByGenre(movies) {
    var themesByGenre = {}
    genresOfInterest.forEach(function (g) {
        themeScores = {}
        themesOfInterest.forEach(function (t) {
            themeScores[t] = 0;
        })
        themesByGenre[g] = {'themes': themeScores, 'total': 0};
    })
    var genresSet = new Set(genresOfInterest)
    movies.forEach(function(d) {
        var genres = new Set(d.genres);
        var intersection = new Set(
            [...genres].filter(x => genresSet.has(x)));
        if (intersection.size > 0) {
            intersection.forEach(function (g) {
                themesByGenre[g]['total'] += 1;
                themesOfInterest.forEach(function (t) {
                    themesByGenre[g]['themes'][t] += d[t + '_conv'];
                })
            })
        }
    });

    for(var genre in themesByGenre) {
        var genreScores = themesByGenre[genre];
        for(var theme in genreScores['themes'])
            if(genreScores['total'])
                genreScores['themes'][theme] /= genreScores['total'];
            else
                genreScores['themes'][theme] = 0;
    }
    console.log(themesByGenre)
    return d3.entries(themesByGenre);
}


d3.csv(dataDir + 'movies.csv', function(error, dataset) {
        // Log and return from an error
        if(error) {
            console.error('Error while loading ./cars.csv dataset.');
            console.error(error);
            return;
        }
        var stringColumns = new Set(['movie_id', 'movie_title']);
        var listColumns = new Set(['genres']);
        // Parse numerical columns to int/float
        dataset.forEach(function(d) {
            for(var key in d) {
                if(stringColumns.has(key))
                    continue;
                if(listColumns.has(key)){
                    d[key] = JSON.parse(d[key].replace(/'/g, '"'));
                }
                else
                    d[key] = +d[key];
            }
        });
        moviesData = dataset;
        // Create groups per genre
        var rowLabelWidth = 100;
        var columnLabelHeight = 50;
        var topMargin = 20;
        var leftMargin = 30;
        var rightMargin = 0;
        var bottomMargin = 0;

        var columnWidth = Math.floor((svgWidth - rowLabelWidth - rightMargin) / genresOfInterest.length);
        var rowHeight = Math.floor((svgHeight - columnLabelHeight - bottomMargin) / themesOfInterest.length);
        console.log(rowHeight, themesOfInterest)
        var genreG = svg.selectAll('.genre')
            .data(Array.from(genresOfInterest), function(d) {
                return d;
            })
            .enter()
            .append('g')
            .attr('class', 'genre')
            .attr('id', function(d) {
                return d;
            })
            .attr('width', columnWidth)
            .attr('height', svgHeight)
            .attr('transform', function(d, i) {
                var tx = rowLabelWidth + i * columnWidth;
                return 'translate('+[tx, topMargin]+')';
            })
        genreG
            .append('text')
            .text(function(d) {
                return d;
            })
            .style('text-anchor', 'middle')
            .style('fill', 'black')
            .style('font-size', 18)
            .style('text-decoration', 'underline')
            .style('font-family', 'Open Sans')

        var themeLabelG = svg.selectAll('.theme-label')
            .data(Array.from(themesOfInterest), function(d) {
                return d;
            })
            .enter()
            .append('g')
            .attr('class', 'theme-label')
            .attr('id', function(d) {
                return d;
            })
            .attr('width', columnWidth)
            .attr('height', rowHeight)
            .attr('transform', function(d, i) {
                return 'translate('+[leftMargin, columnLabelHeight + i * rowHeight]+')';
            })
        themeLabelG
            .append('text')
            .text(function(d) {
                return d;
            })
            .style('text-anchor', 'middle')
            .style('fill', 'black')
            .style('font-size', 18)
            .style('text-decoration', 'underline')
            .style('font-family', 'Open Sans')

        // Create groups for themes for each genre
        // var themeBottomMargin = 30;
        // var barHeight = Math.floor(svgHeight / themesOfInterest.length) - themeBottomMargin;

        var themeColorScale = d3.scaleOrdinal(d3.schemeCategory20);
        // var titleHeight = 30;

        var themesGenreScores = themeScoresByGenre(moviesData)
        var maxThemeScore = d3.max(themesGenreScores, function(d) {
            return d3.max(Object.values(d.value.themes));
        });
        var minThemeScore = d3.min(themesGenreScores, function(d) {
            return d3.min(Object.values(d.value.themes))
        });
        // var allDecades = Array.from(new Set(moviesData.map(decadeForRow)));
        // allDecades.forEach(function(d) {
        //     var decadeThemeScores = themeScoresByGenre(filterMoviesByDecade(moviesData, d))
        //     var decadeMax = d3.max(decadeThemeScores, function(d) {
        //         return d3.max(Object.values(d.value.themes));
        //     });
        //     maxThemeScore = Math.max(maxThemeScore, decadeMax);
        //     var decadeMin = d3.min(decadeThemeScores, function(d) {
        //         return d3.min(Object.values(d.value.themes));
        //     });
        //     minThemeScore = Math.min(minThemeScore, decadeMin)
        // })
        var radiusScale = d3.scaleSqrt()
                .domain([minThemeScore, maxThemeScore])
                .range([3, 20])

        var buckets = 9;
        var colours = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"]
        createBubbleChart = function(filteredScores) {
            var maxThemeScore = d3.max(filteredScores, function(d) {
                return d3.max(Object.values(d.value.themes));
            });
            var minThemeScore = d3.min(filteredScores, function(d) {
                return d3.min(Object.values(d.value.themes))
            });
            var themeColorScale = d3.scaleQuantile()
              .domain([minThemeScore, buckets - 1, maxThemeScore])
              .range(colours);
            var radiusScale = d3.scaleSqrt()
                .domain([minThemeScore, maxThemeScore])
                .range([1, 20])
            var heightScale = d3.scaleSqrt()
                .domain([minThemeScore, maxThemeScore])
                .range([1, 20])
            var genreG = svg
                .selectAll('.genre')
                .data(filteredScores);
            var themesG = genreG.selectAll('.theme')
                .data(function(d) {
                    var data = d3.entries(d.value.themes);
                    return data
                });
            var textWidth = 25;
            var textShiftX = 25;
            var textShiftY = 8;
            var themesGEnter = themesG.enter()
                .append('g')
                .attr('class', 'theme')
                .attr('transform', function(d, i) {
                    var ty = columnLabelHeight - topMargin + i * rowHeight;
                    return 'translate('+ [0, ty] + ')';
                })
            // themesGEnter
            //     .append('circle')
            //     .attr('transform', function(d) {
            //         return 'translate(' + [textWidth + textShiftX, textShiftY] + ')';
            //     })
            //     .attr('fill', function(d) {
            //         return themeColorScale(d.key);
            //     });
            themesGEnter
                .append('rect')
                .attr('fill', function(d) {
                    return themeColorScale(d.value);
                })
            var labelSize = 20;
            themesGEnter
                .append('text')
                .text(function(d) {
                    console.log(d);
                    return d.value.toFixed(0);
                })
                .style('text-anchor', 'middle')
                .style('fill', 'white')
                .style('font-size', labelSize)
                .style('font-family', 'Open Sans')
                .attr('transform', function(d, i) {
                    return 'translate('+ [columnWidth / 2, rowHeight / 2] + ')';
                })


            // Propagates data to child
            // themesG.select('circle')
            themesG.select('rect')

            d3.selectAll('.genre')
                .selectAll('.theme rect')
                // .transition()
                // .duration(750)
                .attr('height', function(d) {
                    return rowHeight;
                })
                .attr('width', function(d) {
                    return columnWidth;
                })
                .text(function(d) {
                    return 'a'
                })
            d3.selectAll('.genre')
                .selectAll('.theme rect')
                // .transition()
                // .duration(750)
                .attr('height', function(d) {
                    return rowHeight;
                })
                .attr('width', function(d) {
                    return columnWidth;
                })
                .text(function(d) {
                    return 'a'
                })
                // .attr('', function(d) {
                //     return radiusScale(d.value);
                // })
                // .attr('transform', function(d) {
                //     return 'translate(' + [textWidth + textShiftX, textShiftY - heightScale(d.value)] + ')';
                // })
        }
        createBubbleChart(themesGenreScores);
        filteredThemesByGenre = themeScoresByGenre(filterMoviesByDecade(moviesData, 1990))
        d3.select('#decadeSelect').on(
            'change', function() {
                if(this.value == 'All')
                    createBubbleChart(themesGenreScores)
                else {
                    var decade = parseInt(this.value.slice(0, -1))
                    createBubbleChart(themeScoresByGenre(filterMoviesByDecade(moviesData, decade)))
                }
            }
        )
    });
