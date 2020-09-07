'use strict';

const Audit = require('lighthouse').Audit;

const MAX_CARD_TIME = 2000;

class LoadAuditApi extends Audit {
    static get meta() {
        return {
            id: 'api-audit',
            title: 'API audit',
            category: 'MyPerformance',
            name: 'api-audit',
            description: 'El tiempo de respuesta del API es: ',
            failureDescription: 'Schedule Card slow to initialize',
            helpText: 'Sirve para medir el tiempo de respuesta del api estaciones',
            requiredArtifacts: ['TimeToApi']
        };
    }

    static audit(artifacts) {
        const loadedTime = artifacts.TimeToApi;

        const belowThreshold = loadedTime <= MAX_CARD_TIME;

        return {
            displayValue: loadedTime,
            score: Number(belowThreshold)
        };
    }
}

module.exports = LoadAuditApi;
