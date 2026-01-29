
describe('@repo/frontend-e2e', () => {
  let sessionId: string;
  let lastQuestion: string;

  it('should display the GLP-1 Eligibility Form', () => {
    cy.visit('/');
    cy.wait(1000);
    const title = cy.get('h1');
    title.should('exist');
  });

  it('should start the survey', () => {
    cy.visit('/');
    cy.wait(1000);
    const button = cy.get('#start-survey-button');
    button.should('exist');
    button.click({ force: true });
    cy.wait(2000);
    cy.url().then(url => {
      sessionId = url.split('/').pop() || '';
      cy.url().should('include', `/${sessionId}`);
    });
  });

  it('should get the last question and save to variable', () => {
    cy.visit(`/${sessionId}/`);
    cy.wait(1000);
    cy.get('h1').should('exist').invoke('text').then((text) => {
      lastQuestion = text;
    });
  });

  it('should get same question again with same session id', () => {
    cy.visit(`/${sessionId}/`);
    cy.wait(1000);
    const title = cy.get('h1');
    title.should('exist');
    title.should('have.text', lastQuestion);
  });

  it('should answer the first question and return failed result', () => {
    cy.visit(`/${sessionId}/`);
    cy.wait(1000);
    cy.get('input[name="answer"]').type('2');
    cy.get('button').contains('Next').click({ force: true });
    cy.wait(1000);
    cy.url().should('include', `/${sessionId}/result`);
    cy.get('h1').should('have.text', 'You are not eligible for the program');
  });

  describe('Complete GLP-1 Eligibility Form - Eligible Path', () => {
    let eligibleSessionId: string;
    before(() => {
      cy.visit('/');
      cy.wait(1000);
      cy.get('#start-survey-button').click({ force: true });
      cy.wait(2000);
      cy.url().then(url => {
        eligibleSessionId = url.split('/').pop() || '';
        cy.url().should('include', `/${eligibleSessionId}`);
      });
    });
    // Normally it should be reload it self but for some reason it's not reloading so we need to visit the page again
    beforeEach(() => {
      if (eligibleSessionId) {
        cy.visit(`/${eligibleSessionId}/`);
        cy.wait(1500);
      }
    });

    it('should answer Age question (30)', () => {
      cy.visit(`/${eligibleSessionId}/`);
      cy.wait(1500);
      cy.get('h1').should('contain', 'age');
      cy.get('input[name="answer"]').type('30');
      cy.get('button').contains('Next').click({ force: true });
      cy.wait(1500);
    });

    it('should answer Weight question (80)', () => {

      cy.get('h1').should('contain', 'weight');
      cy.get('input[name="answer"]').type('80');
      cy.get('button').contains('Next').click({ force: true });
      cy.wait(1500);
    });

    it('should answer Height question (170)', () => {
      cy.get('h1').should('contain', 'height');
      cy.get('input[name="answer"]').type('170');
      cy.get('button').contains('Next').click({ force: true });
      cy.wait(1500);
    });


    it('should answer Pregnancy question (No)', () => {
      cy.get('h1').should('contain', 'pregnant');
      cy.get('button').contains('No').click({ force: true });
      cy.get('button').contains('Next').click({ force: true });
      cy.wait(1500);
    });

    it('should answer Comorbidities question (select 1)', () => {
      cy.get('h1').should('contain', 'chronic conditions');
      cy.get('button').contains('Hypertension').click({ force: true });
      cy.get('button').contains('Next').click({ force: true });
      cy.wait(1500);
    });

    it('should answer Diabetes question (No)', () => {
      cy.get('h1').should('contain', 'diabetes');
      cy.get('button').contains('No').click({ force: true });
      cy.get('button').contains('Next').click({ force: true });
      cy.wait(1500);
    });

    it('should answer Blood Pressure question (Normal or Stage 1)', () => {
      cy.get('h1').should('contain', 'blood pressure');
      cy.get('button').contains('Normal').click({ force: true });
      cy.get('button').contains('Next').click({ force: true });
      cy.wait(1500);
    });

    it('should answer Medications question (without GLP1)', () => {
      cy.get('h1').should('contain', 'medications');
      cy.get('button').contains('ACE inhibitors').click({ force: true });
      cy.get('button').contains('Next').click({ force: true });
      cy.wait(1500);
    });

    it('should answer Smoking question (No)', () => {
      cy.get('h1').should('contain', 'smoke');
      cy.get('button').contains('No').click({ force: true });
      cy.get('button').contains('Next').click({ force: true });
      cy.wait(1500);
    });

    it('should answer Alcohol question (Never)', () => {
      cy.get('h1').should('contain', 'alcohol');
      cy.get('button').contains('Never').click({ force: true });
      cy.get('button').contains('Next').click({ force: true });
      cy.wait(1500);
    });

    it('should answer Activity question (Light)', () => {
      cy.get('h1').should('contain', 'activity');
      cy.get('button').contains('Light').click({ force: true });
      cy.get('button').contains('Next').click({ force: true });
      cy.wait(1500);
    });

    it('should answer Diet question (Balanced) and show eligible result', () => {
      cy.get('h1').should('contain', 'diet');
      cy.get('button').contains('Balanced diet').click({ force: true });
      cy.get('button').contains('Next').click({ force: true });
      cy.wait(2000);
      cy.url().should('include', `/${eligibleSessionId}/result`);
    });
  });
});
