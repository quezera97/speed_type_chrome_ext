import { initializeApp } from './firebase/firebase-app.js'
import { getDatabase, ref, set, get, push} from './firebase/firebase-database.js';
import { getAuth, signOut, onAuthStateChanged  } from './firebase/firebase-auth.js'

$( document ).ready(function() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const levelValue = urlParams.get('level');
    const wpmValue = urlParams.get('wpm');
    const timeValue = urlParams.get('timer');
    const inaccuracyValue = urlParams.get('inaccuracy');
    const accuracyValue = urlParams.get('accuracy');

    $('#time-result').text(timeValue);
    $('#wpm-result').text(wpmValue);
    $('#inaccuracy-result').text(inaccuracyValue);
    $('#accuracy-result').text(accuracyValue);

    const results = {
        time: timeValue,
        wpm: wpmValue,
        accuracy: accuracyValue,
    };

    localStorage.setItem(levelValue, JSON.stringify(results));

    $('#result-body').keydown(function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();

            window.location.href = '../pages/quick_start.html' +
            '?level=' + levelValue;
        }
        else if (e.key === 'Escape') {
            e.preventDefault();

            window.location.href = '../dashboard.html';
        }
    });

    const firebaseConfig = {
        apiKey: "AIzaSyBYtSkWCVLBDWkR_UmL_ojguW1C6gZVPFw",
        authDomain: "keyboardwarrior-c0a0b.firebaseapp.com",
        projectId: "keyboardwarrior-c0a0b",
        storageBucket: "keyboardwarrior-c0a0b.appspot.com",
        messagingSenderId: "838198639101",
        appId: "1:838198639101:web:cfe0a3eecc334ace418194",
        measurementId: "G-ZC2XJ3JLGJ"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const database = getDatabase(app, "https://keyboardwarrior-c0a0b-default-rtdb.asia-southeast1.firebasedatabase.app");
    var hallOfFameResults = {};

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const uid = user.uid;

            const usernameRef = ref(database, uid+'/username');
            get(usernameRef)
                .then((snapshot) => {
                    const usernameValue = snapshot.val();

                    hallOfFameResults = {
                        username: [usernameValue] ?? ['Guest'],
                        time: timeValue,
                        wpm: wpmValue,
                        accuracy: accuracyValue,
                    };

                    if(uid){
                        setUserLevelData(uid, levelValue)
                    }
            });
        }
    });

    function setUserLevelData(uid, level) {

        const hallOfFame = ref(database, 'hall_of_fame/'+level);

        get(hallOfFame).then((snapshot) => {
            if ((snapshot.val())) {
                compareHallOfFame(hallOfFame, hallOfFameResults);
            } else {
                push(hallOfFame, hallOfFameResults)
                    .catch((error) => {
                    console.error('Error creating hall of fame record:', error);
                });
            }
        });

        const userRecordsRef = ref(database, uid+'/records/levels/'+level);
        set(userRecordsRef, results)
            .catch((error) => {
                console.error(`Error creating child record for the "${level}" level`);
            });
    }

    function compareHallOfFame(hallOfFameRef, hallOfFameResults, limit = 15) {
        get(hallOfFameRef)
            .then((snapshot) => {
                const currentKidsEntries = snapshot.val();
                const entriesArray = Object.keys(currentKidsEntries).map(key => ({
                    key,
                    ...currentKidsEntries[key]
                }));
    
                const newAccuracy = parseFloat(hallOfFameResults.accuracy);
                const newWPM = parseFloat(hallOfFameResults.wpm);
    
                const matchingEntry = entriesArray.find(entry =>
                    parseFloat(entry.accuracy) === newAccuracy && parseFloat(entry.wpm) === newWPM
                );
    
                if (matchingEntry) {
                    // Update the username if accuracy and wpm match
                    if (!matchingEntry.username.includes(hallOfFameResults.username[0])) {
                        matchingEntry.username.push(hallOfFameResults.username[0]);
                        set(ref(database, `hall_of_fame/kids/${matchingEntry.key}/username`), matchingEntry.username)
                            .catch((error) => {
                                console.error('Error updating username in hall of fame record:', error);
                            });
                    }
                } else {
                    entriesArray.sort((a, b) => {
                        if (parseFloat(a.accuracy) !== parseFloat(b.accuracy)) {
                            return parseFloat(b.accuracy) - parseFloat(a.accuracy);
                        } else {
                            return parseFloat(b.wpm) - parseFloat(a.wpm);
                        }
                    });
    
                    if (entriesArray.length < limit) {
                        // Add new entry if not reaching the limit
                        push(hallOfFameRef, hallOfFameResults)
                            .catch((error) => {
                                console.error('Error adding new entry to hall of fame:', error);
                            });
                    } else {
                        const lowestEntry = entriesArray[entriesArray.length - 1];
                        const lowestAccuracy = parseFloat(lowestEntry.accuracy);
                        const lowestWPM = parseFloat(lowestEntry.wpm);
    
                        // Update the lowest entry with new details
                        if ((hallOfFameResults.accuracy >= lowestAccuracy && hallOfFameResults.wpm >= lowestWPM) || (hallOfFameResults.accuracy == lowestAccuracy && hallOfFameResults.wpm >= lowestWPM)) {
                        set(ref(database, `hall_of_fame/kids/${lowestEntry.key}`), hallOfFameResults)
                            .catch((error) => {
                                console.error('Error updating lowest entry in hall of fame record:', error);
                            });
                    }
                    }
                }
            })
            .catch((error) => {
                console.error('Error fetching hall of fame data:', error);
            });
    }
    
    
});
            // let lowestEntry = null;
            // let lowestAccuracy = Infinity;
            // let lowestWPM = Infinity;
            // let limitHallOfFame = 3;
            // let pushPerformed = false;
    // //update the new accuracy ad wpm if someone beat
    // if (accuracy < lowestAccuracy || (accuracy == lowestAccuracy && wpm < lowestWPM)) {
    //     lowestEntry = key;
    //     lowestAccuracy = accuracy;
    //     lowestWPM = wpm;
    // }
    // else {
    //     //add new if not meet the limit
    //     if(!pushPerformed && Object.keys(currentKidsEntries).length <= limitHallOfFame){
    //         push(hallOfFameRef, hallOfFameResults)
    //             .catch((error) => {
    //             console.error('Error creating hall of fame record:', error);
    //         });
    
    //         pushPerformed = true;
    //     }
    // }
    
    // if (hallOfFameResults.accuracy >= lowestAccuracy && hallOfFameResults.wpm >= lowestWPM) {
    //     set(ref(database, `hall_of_fame/kids/${lowestEntry}`), hallOfFameResults)
    //     .catch((error) => {
    //             console.error('Error updating hall of fame record:', error);
    //         });
    // }