/**
 * routes-data.js
 * ==============
 * Banco de dados global de rotas e distâncias brasileiras.
 */

var RoutesDB = {

  // 1. Array de rotas (Propriedade 'routes')
  routes: [
    // Capital ↔ Capital
    { origin: "São Paulo, SP",         destination: "Rio de Janeiro, RJ",    distanceKm: 430   },
    { origin: "São Paulo, SP",         destination: "Brasília, DF",          distanceKm: 1015  },
    { origin: "Rio de Janeiro, RJ",    destination: "Brasília, DF",          distanceKm: 1148  },
    { origin: "São Paulo, SP",         destination: "Belo Horizonte, MG",    distanceKm: 586   },
    { origin: "Rio de Janeiro, RJ",    destination: "Belo Horizonte, MG",    distanceKm: 434   },
    { origin: "São Paulo, SP",         destination: "Salvador, BA",          distanceKm: 1972  },
    { origin: "São Paulo, SP",         destination: "Fortaleza, CE",         distanceKm: 3126  },
    { origin: "São Paulo, SP",         destination: "Curitiba, PR",          distanceKm: 408   },
    { origin: "São Paulo, SP",         destination: "Porto Alegre, RS",      distanceKm: 1109  },
    { origin: "São Paulo, SP",         destination: "Manaus, AM",            distanceKm: 4306  },
    { origin: "São Paulo, SP",         destination: "Recife, PE",            distanceKm: 2661  },
    { origin: "Brasília, DF",          destination: "Goiânia, GO",           distanceKm: 209   },
    { origin: "Brasília, DF",          destination: "Salvador, BA",          distanceKm: 1449  },
    { origin: "Brasília, DF",          destination: "Belo Horizonte, MG",    distanceKm: 740   },
    { origin: "Brasília, DF",          destination: "Fortaleza, CE",         distanceKm: 2209  },
    { origin: "Brasília, DF",          destination: "Curitiba, PR",          distanceKm: 1388  },
    { origin: "Brasília, DF",          destination: "Porto Alegre, RS",      distanceKm: 2027  },
    { origin: "Salvador, BA",          destination: "Recife, PE",            distanceKm: 839   },
    { origin: "Salvador, BA",          destination: "Fortaleza, CE",         distanceKm: 1179  },
    { origin: "Recife, PE",            destination: "Fortaleza, CE",         distanceKm: 800   },
    { origin: "Recife, PE",            destination: "João Pessoa, PB",       distanceKm: 121   },
    { origin: "Fortaleza, CE",         destination: "Natal, RN",             distanceKm: 537   },
    { origin: "Curitiba, PR",          destination: "Porto Alegre, RS",      distanceKm: 713   },
    { origin: "Curitiba, PR",          destination: "Florianópolis, SC",     distanceKm: 300   },
    { origin: "Porto Alegre, RS",      destination: "Florianópolis, SC",     distanceKm: 476   },
    { origin: "Belo Horizonte, MG",    destination: "Vitória, ES",           distanceKm: 524   },
    { origin: "Manaus, AM",            destination: "Belém, PA",             distanceKm: 2514  },
    { origin: "Belém, PA",             destination: "São Luís, MA",          distanceKm: 807   },

    // Regional / Estadual
    { origin: "São Paulo, SP",         destination: "Campinas, SP",          distanceKm: 95    },
    { origin: "São Paulo, SP",         destination: "Santos, SP",            distanceKm: 73    },
    { origin: "São Paulo, SP",         destination: "Ribeirão Preto, SP",    distanceKm: 313   },
    { origin: "São Paulo, SP",         destination: "Sorocaba, SP",          distanceKm: 100   },
    { origin: "São Paulo, SP",         destination: "São José dos Campos, SP", distanceKm: 99  },
    { origin: "Rio de Janeiro, RJ",    destination: "Niterói, RJ",           distanceKm: 13    },
    { origin: "Rio de Janeiro, RJ",    destination: "Petrópolis, RJ",        distanceKm: 68    },
    { origin: "Rio de Janeiro, RJ",    destination: "Angra dos Reis, RJ",    distanceKm: 168   },
    { origin: "Belo Horizonte, MG",    destination: "Ouro Preto, MG",        distanceKm: 100   },
    { origin: "Belo Horizonte, MG",    destination: "Uberlândia, MG",        distanceKm: 554   },
    { origin: "Belo Horizonte, MG",    destination: "Juiz de Fora, MG",      distanceKm: 283   },
    { origin: "Curitiba, PR",          destination: "Londrina, PR",          distanceKm: 378   },
    { origin: "Curitiba, PR",          destination: "Foz do Iguaçu, PR",     distanceKm: 639   },
    { origin: "Porto Alegre, RS",      destination: "Caxias do Sul, RS",     distanceKm: 127   }
  ],

  // 2. Método para listar todas as cidades únicas
  getAllCities: function () {
    var seen = {};
    var cities = [];

    // 'this.routes' acessa o array declarado acima
    this.routes.forEach(function (route) {
      [route.origin, route.destination].forEach(function (city) {
        var key = city.toLowerCase();
        if (!seen[key]) {
          seen[key] = true;
          cities.push(city);
        }
      });
    });

    // Ordenação alfabética natural (PT-BR)
    cities.sort(function (a, b) {
      return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
    });

    return cities;
  },

  // 3. Método para encontrar a distância entre duas cidades
  findDistance: function (origin, destination) {
    function normalize(str) {
      return (str || "").trim().toLowerCase();
    }

    var normOrigin = normalize(origin);
    var normDestination = normalize(destination);

    if (!normOrigin || !normDestination) return null;

    // Busca bidirecional (A para B ou B para A)
    for (var i = 0; i < this.routes.length; i++) {
      var route = this.routes[i];
      var routeOrigin = normalize(route.origin);
      var routeDest = normalize(route.destination);

      var matchForward = (routeOrigin === normOrigin && routeDest === normDestination);
      var matchReverse = (routeOrigin === normDestination && routeDest === normOrigin);

      if (matchForward || matchReverse) {
        return route.distanceKm;
      }
    }

    return null;
  }

}; // Fim do objeto RoutesDB