/* eslint-disable indent */

/**
 * Module for building cards from item data.
 * @module components/cardBuilder/cardBuilder
 */

import datetime from 'datetime';
import imageLoader from 'imageLoader';
import connectionManager from 'connectionManager';
import itemHelper from 'itemHelper';
import focusManager from 'focusManager';
import indicators from 'indicators';
import globalize from 'globalize';
import layoutManager from 'layoutManager';
import dom from 'dom';
import browser from 'browser';
import playbackManager from 'playbackManager';
import itemShortcuts from 'itemShortcuts';
import imageHelper from 'scripts/imagehelper';
import 'css!./card';
import 'paper-icon-button-light';
import 'programStyles';

        const enableFocusTransform = !browser.slow && !browser.edge;

        /**
         * Generate the HTML markup for cards for a set of items.
         * @param items - The items used to generate cards.
         * @param options - The options of the cards.
         * @returns {string} The HTML markup for the cards.
         */
        export function getCardsHtml(items, options) {
            if (arguments.length === 1) {
                options = arguments[0];
                items = options.items;
            }

            return buildCardsHtmlInternal(items, options);
        }

        /**
         * Computes the number of posters per row.
         * @param {string} shape - Shape of the cards.
         * @param {number} screenWidth - Width of the screen.
         * @param {boolean} isOrientationLandscape - Flag for the orientation of the screen.
         * @returns {number} Number of cards per row for an itemsContainer.
         */
        function getPostersPerRow(shape, screenWidth, isOrientationLandscape) {
            switch (shape) {
                case 'portrait':
                    if (layoutManager.tv) {
                        return 100 / 16.66666667;
                    }
                    if (screenWidth >= 2200) {
                        return 100 / 10;
                    }
                    if (screenWidth >= 1920) {
                        return 100 / 11.1111111111;
                    }
                    if (screenWidth >= 1600) {
                        return 100 / 12.5;
                    }
                    if (screenWidth >= 1400) {
                        return 100 / 14.28571428571;
                    }
                    if (screenWidth >= 1200) {
                        return 100 / 16.66666667;
                    }
                    if (screenWidth >= 800) {
                        return 5;
                    }
                    if (screenWidth >= 700) {
                        return 4;
                    }
                    if (screenWidth >= 500) {
                        return 100 / 33.33333333;
                    }
                    return 100 / 33.33333333;
                case 'square':
                    if (layoutManager.tv) {
                        return 100 / 16.66666667;
                    }
                    if (screenWidth >= 2200) {
                        return 100 / 10;
                    }
                    if (screenWidth >= 1920) {
                        return 100 / 11.1111111111;
                    }
                    if (screenWidth >= 1600) {
                        return 100 / 12.5;
                    }
                    if (screenWidth >= 1400) {
                        return 100 / 14.28571428571;
                    }
                    if (screenWidth >= 1200) {
                        return 100 / 16.66666667;
                    }
                    if (screenWidth >= 800) {
                        return 5;
                    }
                    if (screenWidth >= 700) {
                        return 4;
                    }
                    if (screenWidth >= 500) {
                        return 100 / 33.33333333;
                    }
                    return 2;
                case 'banner':
                    if (screenWidth >= 2200) {
                        return 100 / 25;
                    }
                    if (screenWidth >= 1200) {
                        return 100 / 33.33333333;
                    }
                    if (screenWidth >= 800) {
                        return 2;
                    }
                    return 1;
                case 'backdrop':
                    if (layoutManager.tv) {
                        return 100 / 25;
                    }
                    if (screenWidth >= 2500) {
                        return 6;
                    }
                    if (screenWidth >= 1600) {
                        return 5;
                    }
                    if (screenWidth >= 1200) {
                        return 4;
                    }
                    if (screenWidth >= 770) {
                        return 3;
                    }
                    if (screenWidth >= 420) {
                        return 2;
                    }
                    return 1;
                case 'smallBackdrop':
                    if (screenWidth >= 1600) {
                        return 100 / 12.5;
                    }
                    if (screenWidth >= 1400) {
                        return 100 / 14.2857142857;
                    }
                    if (screenWidth >= 1200) {
                        return 100 / 16.666666666666666666;
                    }
                    if (screenWidth >= 1000) {
                        return 5;
                    }
                    if (screenWidth >= 800) {
                        return 4;
                    }
                    if (screenWidth >= 500) {
                        return 100 / 33.33333333;
                    }
                    return 2;
                case 'overflowSmallBackdrop':
                    if (layoutManager.tv) {
                        return 100 / 18.9;
                    }
                    if (isOrientationLandscape) {
                        if (screenWidth >= 800) {
                            return 100 / 15.5;
                        }
                        return 100 / 23.3;
                    } else {
                        if (screenWidth >= 540) {
                            return 100 / 30;
                        }
                        return 100 / 72;
                    }
                case 'overflowPortrait':

                    if (layoutManager.tv) {
                        return 100 / 15.5;
                    }
                    if (isOrientationLandscape) {
                        if (screenWidth >= 1700) {
                            return 100 / 11.6;
                        }
                        return 100 / 15.5;
                    } else {
                        if (screenWidth >= 1400) {
                            return 100 / 15;
                        }
                        if (screenWidth >= 1200) {
                            return 100 / 18;
                        }
                        if (screenWidth >= 760) {
                            return 100 / 23;
                        }
                        if (screenWidth >= 400) {
                            return 100 / 31.5;
                        }
                        return 100 / 42;
                    }
                case 'overflowSquare':
                    if (layoutManager.tv) {
                        return 100 / 15.5;
                    }
                    if (isOrientationLandscape) {
                        if (screenWidth >= 1700) {
                            return 100 / 11.6;
                        }
                        return 100 / 15.5;
                    } else {
                        if (screenWidth >= 1400) {
                            return 100 / 15;
                        }
                        if (screenWidth >= 1200) {
                            return 100 / 18;
                        }
                        if (screenWidth >= 760) {
                            return 100 / 23;
                        }
                        if (screenWidth >= 540) {
                            return 100 / 31.5;
                        }
                        return 100 / 42;
                    }
                case 'overflowBackdrop':
                    if (layoutManager.tv) {
                        return 100 / 23.3;
                    }
                    if (isOrientationLandscape) {
                        if (screenWidth >= 1700) {
                            return 100 / 18.5;
                        }
                        return 100 / 23.3;
                    } else {
                        if (screenWidth >= 1800) {
                            return 100 / 23.5;
                        }
                        if (screenWidth >= 1400) {
                            return 100 / 30;
                        }
                        if (screenWidth >= 760) {
                            return 100 / 40;
                        }
                        if (screenWidth >= 640) {
                            return 100 / 56;
                        }
                        return 100 / 72;
                    }
                default:
                    return 4;
            }
        }

        /**
         * Checks if the window is resizable.
         * @param {number} windowWidth - Width of the device's screen.
         * @returns {boolean} - Result of the check.
         */
        function isResizable(windowWidth) {
            const screen = window.screen;
            if (screen) {
                const screenWidth = screen.availWidth;

                if ((screenWidth - windowWidth) > 20) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Gets the width of a card's image according to the shape and amount of cards per row.
         * @param {string} shape - Shape of the card.
         * @param {number} screenWidth - Width of the screen.
         * @param {boolean} isOrientationLandscape - Flag for the orientation of the screen.
         * @returns {number} Width of the image for a card.
         */
        function getImageWidth(shape, screenWidth, isOrientationLandscape) {
            const imagesPerRow = getPostersPerRow(shape, screenWidth, isOrientationLandscape);
            return Math.round(screenWidth / imagesPerRow) * 2;
        }

        /**
         * Normalizes the options for a card.
         * @param {Object} items - A set of items.
         * @param {Object} options - Options for handling the items.
         */
        function setCardData(items, options) {
            options.shape = options.shape || 'auto';

            const primaryImageAspectRatio = imageLoader.getPrimaryImageAspectRatio(items);

            if (['auto', 'autohome', 'autooverflow', 'autoVertical'].includes(options.shape)) {

                const requestedShape = options.shape;
                options.shape = null;

                if (primaryImageAspectRatio) {

                    if (primaryImageAspectRatio >= 3) {
                        options.shape = 'banner';
                        options.coverImage = true;
                    } else if (primaryImageAspectRatio >= 1.33) {
                        options.shape = requestedShape === 'autooverflow' ? 'overflowBackdrop' : 'backdrop';
                    } else if (primaryImageAspectRatio > 0.71) {
                        options.shape = requestedShape === 'autooverflow' ? 'overflowSquare' : 'square';
                    } else {
                        options.shape = requestedShape === 'autooverflow' ? 'overflowPortrait' : 'portrait';
                    }
                }

                if (!options.shape) {
                    options.shape = options.defaultShape || (requestedShape === 'autooverflow' ? 'overflowSquare' : 'square');
                }
            }

            if (options.preferThumb === 'auto') {
                options.preferThumb = options.shape === 'backdrop' || options.shape === 'overflowBackdrop';
            }

            options.uiAspect = getDesiredAspect(options.shape);
            options.primaryImageAspectRatio = primaryImageAspectRatio;

            if (!options.width && options.widths) {
                options.width = options.widths[options.shape];
            }

            if (options.rows && typeof (options.rows) !== 'number') {
                options.rows = options.rows[options.shape];
            }

            if (!options.width) {
                let screenWidth = dom.getWindowSize().innerWidth;
                const screenHeight = dom.getWindowSize().innerHeight;

                if (isResizable(screenWidth)) {
                    const roundScreenTo = 100;
                    screenWidth = Math.floor(screenWidth / roundScreenTo) * roundScreenTo;
                }

                options.width = getImageWidth(options.shape, screenWidth, screenWidth > (screenHeight * 1.3));
            }
        }

        /**
         * Generates the internal HTML markup for cards.
         * @param {Object} items - Items for which to generate the markup.
         * @param {Object} options - Options for generating the markup.
         * @returns {string} The internal HTML markup of the cards.
         */
        function buildCardsHtmlInternal(items, options) {
            let isVertical = false;

            if (options.shape === 'autoVertical') {
                isVertical = true;
            }

            setCardData(items, options);

            let html = '';
            let itemsInRow = 0;

            let currentIndexValue;
            let hasOpenRow;
            let hasOpenSection;

            let sectionTitleTagName = options.sectionTitleTagName || 'div';
            let apiClient;
            let lastServerId;

            for (const [i, item] of items.entries()) {
                let serverId = item.ServerId || options.serverId;

                if (serverId !== lastServerId) {
                    lastServerId = serverId;
                    apiClient = connectionManager.getApiClient(lastServerId);
                }

                if (options.indexBy) {
                    let newIndexValue = '';

                    if (options.indexBy === 'PremiereDate') {
                        if (item.PremiereDate) {
                            try {
                                newIndexValue = datetime.toLocaleDateString(datetime.parseISO8601Date(item.PremiereDate), { weekday: 'long', month: 'long', day: 'numeric' });
                            } catch (error) {
                                console.error('error parsing timestamp for premiere date', error);
                            }
                        }
                    } else if (options.indexBy === 'ProductionYear') {
                        newIndexValue = item.ProductionYear;
                    } else if (options.indexBy === 'CommunityRating') {
                        newIndexValue = item.CommunityRating ? (Math.floor(item.CommunityRating) + (item.CommunityRating % 1 >= 0.5 ? 0.5 : 0)) + '+' : null;
                    }

                    if (newIndexValue !== currentIndexValue) {

                        if (hasOpenRow) {
                            html += '</div>';
                            hasOpenRow = false;
                            itemsInRow = 0;
                        }

                        if (hasOpenSection) {

                            html += '</div>';

                            if (isVertical) {
                                html += '</div>';
                            }
                            hasOpenSection = false;
                        }

                        if (isVertical) {
                            html += '<div class="verticalSection">';
                        } else {
                            html += '<div class="horizontalSection">';
                        }
                        html += '<' + sectionTitleTagName + ' class="sectionTitle">' + newIndexValue + '</' + sectionTitleTagName + '>';
                        if (isVertical) {
                            html += '<div class="itemsContainer vertical-wrap">';
                        }
                        currentIndexValue = newIndexValue;
                        hasOpenSection = true;
                    }
                }

                if (options.rows && itemsInRow === 0) {

                    if (hasOpenRow) {
                        html += '</div>';
                        hasOpenRow = false;
                    }

                    html += '<div class="cardColumn">';
                    hasOpenRow = true;
                }

                html += buildCard(i, item, apiClient, options);

                itemsInRow++;

                if (options.rows && itemsInRow >= options.rows) {
                    html += '</div>';
                    hasOpenRow = false;
                    itemsInRow = 0;
                }
            }

            if (hasOpenRow) {
                html += '</div>';
            }

            if (hasOpenSection) {
                html += '</div>';

                if (isVertical) {
                    html += '</div>';
                }
            }

            return html;
        }

        /**
         * Computes the aspect ratio for a card given its shape.
         * @param {string} shape - Shape for which to get the aspect ratio.
         * @returns {null|number} Ratio of the shape.
         */
        function getDesiredAspect(shape) {
            if (shape) {
                shape = shape.toLowerCase();
                if (shape.indexOf('portrait') !== -1) {
                    return (2 / 3);
                }
                if (shape.indexOf('backdrop') !== -1) {
                    return (16 / 9);
                }
                if (shape.indexOf('square') !== -1) {
                    return 1;
                }
                if (shape.indexOf('banner') !== -1) {
                    return (1000 / 185);
                }
            }
            return null;
        }

        /** Get the URL of the card's image.
         * @param {Object} item - Item for which to generate a card.
         * @param {Object} apiClient - API client object.
         * @param {Object} options - Options of the card.
         * @param {string} shape - Shape of the desired image.
         * @returns {Object} Object representing the URL of the card's image.
         */
        function getCardImageUrl(item, apiClient, options, shape) {
            item = item.ProgramInfo || item;

            const width = options.width;
            let height = null;
            const primaryImageAspectRatio = item.PrimaryImageAspectRatio;
            let forceName = false;
            let imgUrl = null;
            let imgTag = null;
            let coverImage = false;
            let uiAspect = null;
            let imgType = null;
            let itemId = null;

            if (options.preferThumb && item.ImageTags && item.ImageTags.Thumb) {
                imgType = 'Thumb';
                imgTag = item.ImageTags.Thumb;
            } else if ((options.preferBanner || shape === 'banner') && item.ImageTags && item.ImageTags.Banner) {
                imgType = 'Banner';
                imgTag = item.ImageTags.Banner;
            } else if (options.preferDisc && item.ImageTags && item.ImageTags.Disc) {
                imgType = 'Disc';
                imgTag = item.ImageTags.Disc;
            } else if (options.preferLogo && item.ImageTags && item.ImageTags.Logo) {
                imgType = 'Logo';
                imgTag = item.ImageTags.Logo;
            } else if (options.preferLogo && item.ParentLogoImageTag && item.ParentLogoItemId) {
                imgType = 'Logo';
                imgTag = item.ParentLogoImageTag;
                itemId = item.ParentLogoItemId;
            } else if (options.preferThumb && item.SeriesThumbImageTag && options.inheritThumb !== false) {
                imgType = 'Thumb';
                imgTag = item.SeriesThumbImageTag;
                itemId = item.SeriesId;
            } else if (options.preferThumb && item.ParentThumbItemId && options.inheritThumb !== false && item.MediaType !== 'Photo') {
                imgType = 'Thumb';
                imgTag = item.ParentThumbImageTag;
                itemId = item.ParentThumbItemId;
            } else if (options.preferThumb && item.BackdropImageTags && item.BackdropImageTags.length) {
                imgType = 'Backdrop';
                imgTag = item.BackdropImageTags[0];
                forceName = true;
            } else if (options.preferThumb && item.ParentBackdropImageTags && item.ParentBackdropImageTags.length && options.inheritThumb !== false && item.Type === 'Episode') {
                imgType = 'Backdrop';
                imgTag = item.ParentBackdropImageTags[0];
                itemId = item.ParentBackdropItemId;
            } else if (item.ImageTags && item.ImageTags.Primary && (item.Type !== 'Episode' || item.ChildCount !== 0)) {
                imgType = 'Primary';
                imgTag = item.ImageTags.Primary;
                height = width && primaryImageAspectRatio ? Math.round(width / primaryImageAspectRatio) : null;

                if (options.preferThumb && options.showTitle !== false) {
                    forceName = true;
                }

                if (primaryImageAspectRatio) {
                    uiAspect = getDesiredAspect(shape);
                    if (uiAspect) {
                        coverImage = (Math.abs(primaryImageAspectRatio - uiAspect) / uiAspect) <= 0.2;
                    }
                }
            } else if (item.SeriesPrimaryImageTag) {
                imgType = 'Primary';
                imgTag = item.SeriesPrimaryImageTag;
                itemId = item.SeriesId;
            } else if (item.PrimaryImageTag) {
                imgType = 'Primary';
                imgTag = item.PrimaryImageTag;
                itemId = item.PrimaryImageItemId;
                height = width && primaryImageAspectRatio ? Math.round(width / primaryImageAspectRatio) : null;

                if (options.preferThumb && options.showTitle !== false) {
                    forceName = true;
                }

                if (primaryImageAspectRatio) {
                    uiAspect = getDesiredAspect(shape);
                    if (uiAspect) {
                        coverImage = (Math.abs(primaryImageAspectRatio - uiAspect) / uiAspect) <= 0.2;
                    }
                }
            } else if (item.ParentPrimaryImageTag) {
                imgType = 'Primary';
                imgTag = item.ParentPrimaryImageTag;
                itemId = item.ParentPrimaryImageItemId;
            } else if (item.AlbumId && item.AlbumPrimaryImageTag) {
                imgType = 'Primary';
                imgTag = item.AlbumPrimaryImageTag;
                itemId = item.AlbumId;
                height = width && primaryImageAspectRatio ? Math.round(width / primaryImageAspectRatio) : null;

                if (primaryImageAspectRatio) {
                    uiAspect = getDesiredAspect(shape);
                    if (uiAspect) {
                        coverImage = (Math.abs(primaryImageAspectRatio - uiAspect) / uiAspect) <= 0.2;
                    }
                }
            } else if (item.Type === 'Season' && item.ImageTags && item.ImageTags.Thumb) {
                imgType = 'Thumb';
                imgTag = item.ImageTags.Thumb;
            } else if (item.BackdropImageTags && item.BackdropImageTags.length) {
                imgType = 'Backdrop';
                imgTag = item.BackdropImageTags[0];
            } else if (item.ImageTags && item.ImageTags.Thumb) {
                imgType = 'Thumb';
                imgTag = item.ImageTags.Thumb;
            } else if (item.SeriesThumbImageTag && options.inheritThumb !== false) {
                imgType = 'Thumb';
                imgTag = item.SeriesThumbImageTag;
                itemId = item.SeriesId;
            } else if (item.ParentThumbItemId && options.inheritThumb !== false) {
                imgType = 'Thumb';
                imgTag = item.ParentThumbImageTag;
                itemId = item.ParentThumbItemId;
            } else if (item.ParentBackdropImageTags && item.ParentBackdropImageTags.length && options.inheritThumb !== false) {
                imgType = 'Backdrop';
                imgTag = item.ParentBackdropImageTags[0];
                itemId = item.ParentBackdropItemId;
            }

            if (!itemId) {
                itemId = item.Id;
            }

            if (imgTag && imgType) {
                imgUrl = apiClient.getScaledImageUrl(itemId, {
                    type: imgType,
                    maxHeight: height,
                    maxWidth: width,
                    tag: imgTag
                });
            }

            let blurHashes = options.imageBlurhashes || item.ImageBlurHashes || {};

            return {
                imgUrl: imgUrl,
                blurhash: (blurHashes[imgType] || {})[imgTag],
                forceName: forceName,
                coverImage: coverImage
            };
        }

        /**
         * Generates a random integer in a given range.
         * @param {number} min - Minimum of the range.
         * @param {number} max - Maximum of the range.
         * @returns {number} Randomly generated number.
         */
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        /**
         * Generates an index used to select the default color of a card based on a string.
         * @param {string} str - String to use for generating the index.
         * @returns {number} Index of the color.
         */
        function getDefaultColorIndex(str) {
            const numRandomColors = 5;

            if (str) {
                const charIndex = Math.floor(str.length / 2);
                const character = String(str.substr(charIndex, 1).charCodeAt());
                let sum = 0;
                for (let i = 0; i < character.length; i++) {
                    sum += parseInt(character.charAt(i));
                }
                let index = String(sum).substr(-1);

                return (index % numRandomColors) + 1;
            } else {
                return getRandomInt(1, numRandomColors);
            }
        }

        /**
         * Generates the HTML markup for a card's text.
         * @param {Array} lines - Array containing the text lines.
         * @param {string} cssClass - Base CSS class to use for the lines.
         * @param {boolean} forceLines - Flag to force the rendering of all lines.
         * @param {boolean} isOuterFooter - Flag to mark the text lines as outer footer.
         * @param {string} cardLayout - DEPRECATED
         * @param {boolean} addRightMargin - Flag to add a right margin to the text.
         * @param {number} maxLines - Maximum number of lines to render.
         * @returns {string} HTML markup for the card's text.
         */
        function getCardTextLines(lines, cssClass, forceLines, isOuterFooter, cardLayout, addRightMargin, maxLines) {
            let html = '';

            let valid = 0;

            for (let i = 0; i < lines.length; i++) {

                let currentCssClass = cssClass;
                let text = lines[i];

                if (valid > 0 && isOuterFooter) {
                    currentCssClass += ' cardText-secondary';
                } else if (valid === 0 && isOuterFooter) {
                    currentCssClass += ' cardText-first';
                }

                if (addRightMargin) {
                    currentCssClass += ' cardText-rightmargin';
                }

                if (text) {
                    html += "<div class='" + currentCssClass + "'>";
                    html += text;
                    html += '</div>';
                    valid++;

                    if (maxLines && valid >= maxLines) {
                        break;
                    }
                }
            }

            if (forceLines) {

                let linesLength = maxLines || Math.min(lines.length, maxLines || lines.length);

                while (valid < linesLength) {
                    html += "<div class='" + cssClass + "'>&nbsp;</div>";
                    valid++;
                }
            }

            return html;
        }

        /**
         * Determines if the item is live TV.
         * @param {Object} item - Item to use for the check.
         * @returns {boolean} Flag showing if the item is live TV.
         */
        function isUsingLiveTvNaming(item) {
            return item.Type === 'Program' || item.Type === 'Timer' || item.Type === 'Recording';
        }

        /**
         * Returns the air time text for the item based on the given times.
         * @param {object} item - Item used to generate the air time text.
         * @param {string} showAirDateTime - ISO8601 date for the start of the show.
         * @param {string} showAirEndTime - ISO8601 date for the end of the show.
         * @returns {string} The air time text for the item based on the given dates.
         */
        function getAirTimeText(item, showAirDateTime, showAirEndTime) {
            let airTimeText = '';

            if (item.StartDate) {

                try {
                    let date = datetime.parseISO8601Date(item.StartDate);

                    if (showAirDateTime) {
                        airTimeText += datetime.toLocaleDateString(date, { weekday: 'short', month: 'short', day: 'numeric' }) + ' ';
                    }

                    airTimeText += datetime.getDisplayTime(date);

                    if (item.EndDate && showAirEndTime) {
                        date = datetime.parseISO8601Date(item.EndDate);
                        airTimeText += ' - ' + datetime.getDisplayTime(date);
                    }
                } catch (e) {
                    console.error('error parsing date: ' + item.StartDate);
                }
            }

            return airTimeText;
        }

        /**
         * Generates the HTML markup for the card's footer text.
         * @param {Object} item - Item used to generate the footer text.
         * @param {Object} apiClient - API client instance.
         * @param {Object} options - Options used to generate the footer text.
         * @param {string} showTitle - Flag to show the title in the footer.
         * @param {boolean} forceName - Flag to force showing the name of the item.
         * @param {boolean} overlayText - Flag to show overlay text.
         * @param {Object} imgUrl - Object representing the card's image URL.
         * @param {string} footerClass - CSS classes of the footer element.
         * @param {string} progressHtml - HTML markup of the progress bar element.
         * @param {string} logoUrl - URL of the logo for the item.
         * @param {boolean} isOuterFooter - Flag to mark the text as outer footer.
         * @returns {string} HTML markup of the card's footer text element.
         */
        function getCardFooterText(item, apiClient, options, showTitle, forceName, overlayText, imgUrl, footerClass, progressHtml, logoUrl, isOuterFooter) {
            let html = '';

            if (logoUrl) {
                html += '<div class="lazy cardFooterLogo" data-src="' + logoUrl + '"></div>';
            }

            const showOtherText = isOuterFooter ? !overlayText : overlayText;

            if (isOuterFooter && options.cardLayout && layoutManager.mobile) {

                if (options.cardFooterAside !== 'none') {
                    html += '<button is="paper-icon-button-light" class="itemAction btnCardOptions cardText-secondary" data-action="menu"><span class="material-icons more_vert"></span></button>';
                }
            }

            const cssClass = options.centerText ? 'cardText cardTextCentered' : 'cardText';
            const serverId = item.ServerId || options.serverId;

            let lines = [];
            const parentTitleUnderneath = item.Type === 'MusicAlbum' || item.Type === 'Audio' || item.Type === 'MusicVideo';
            let titleAdded;

            if (showOtherText) {
                if ((options.showParentTitle || options.showParentTitleOrTitle) && !parentTitleUnderneath) {

                    if (isOuterFooter && item.Type === 'Episode' && item.SeriesName) {

                        if (item.SeriesId) {
                            lines.push(getTextActionButton({
                                Id: item.SeriesId,
                                ServerId: serverId,
                                Name: item.SeriesName,
                                Type: 'Series',
                                IsFolder: true
                            }));
                        } else {
                            lines.push(item.SeriesName);
                        }
                    } else {

                        if (isUsingLiveTvNaming(item)) {

                            lines.push(item.Name);

                            if (!item.EpisodeTitle) {
                                titleAdded = true;
                            }

                        } else {
                            const parentTitle = item.SeriesName || item.Series || item.Album || item.AlbumArtist || '';

                            if (parentTitle || showTitle) {
                                lines.push(parentTitle);
                            }
                        }
                    }
                }
            }

            let showMediaTitle = (showTitle && !titleAdded) || (options.showParentTitleOrTitle && !lines.length);
            if (!showMediaTitle && !titleAdded && (showTitle || forceName)) {
                showMediaTitle = true;
            }

            if (showMediaTitle) {

                const name = options.showTitle === 'auto' && !item.IsFolder && item.MediaType === 'Photo' ? '' : itemHelper.getDisplayName(item, {
                    includeParentInfo: options.includeParentInfoInTitle
                });

                lines.push(getTextActionButton({
                    Id: item.Id,
                    ServerId: serverId,
                    Name: name,
                    Type: item.Type,
                    CollectionType: item.CollectionType,
                    IsFolder: item.IsFolder
                }));
            }

            if (showOtherText) {
                if (options.showParentTitle && parentTitleUnderneath) {

                    if (isOuterFooter && item.AlbumArtists && item.AlbumArtists.length) {
                        item.AlbumArtists[0].Type = 'MusicArtist';
                        item.AlbumArtists[0].IsFolder = true;
                        lines.push(getTextActionButton(item.AlbumArtists[0], null, serverId));
                    } else {
                        lines.push(isUsingLiveTvNaming(item) ? item.Name : (item.SeriesName || item.Series || item.Album || item.AlbumArtist || ''));
                    }
                }

                if (options.showItemCounts) {
                    lines.push(getItemCountsHtml(options, item));
                }

                if (options.textLines) {
                    const additionalLines = options.textLines(item);
                    for (let i = 0; i < additionalLines.length; i++) {
                        lines.push(additionalLines[i]);
                    }
                }

                if (options.showSongCount) {
                    let songLine = '';

                    if (item.SongCount) {
                        songLine = item.SongCount === 1 ?
                            globalize.translate('ValueOneSong') :
                            globalize.translate('ValueSongCount', item.SongCount);
                    }

                    lines.push(songLine);
                }

                if (options.showPremiereDate) {

                    if (item.PremiereDate) {
                        try {
                            lines.push(datetime.toLocaleDateString(
                                datetime.parseISO8601Date(item.PremiereDate),
                                { weekday: 'long', month: 'long', day: 'numeric' }
                            ));
                        } catch (err) {
                            lines.push('');

                        }
                    } else {
                        lines.push('');
                    }
                }

                if (options.showYear || options.showSeriesYear) {

                    if (item.Type === 'Series') {
                        if (item.Status === 'Continuing') {

                            lines.push(globalize.translate('SeriesYearToPresent', item.ProductionYear || ''));

                        } else {

                            if (item.EndDate && item.ProductionYear) {
                                const endYear = datetime.parseISO8601Date(item.EndDate).getFullYear();
                                lines.push(item.ProductionYear + ((endYear === item.ProductionYear) ? '' : (' - ' + endYear)));
                            } else {
                                lines.push(item.ProductionYear || '');
                            }
                        }
                    } else {
                        lines.push(item.ProductionYear || '');
                    }
                }

                if (options.showRuntime) {

                    if (item.RunTimeTicks) {

                        lines.push(datetime.getDisplayRunningTime(item.RunTimeTicks));
                    } else {
                        lines.push('');
                    }
                }

                if (options.showAirTime) {

                    lines.push(getAirTimeText(item, options.showAirDateTime, options.showAirEndTime) || '');
                }

                if (options.showChannelName) {

                    if (item.ChannelId) {

                        lines.push(getTextActionButton({

                            Id: item.ChannelId,
                            ServerId: serverId,
                            Name: item.ChannelName,
                            Type: 'TvChannel',
                            MediaType: item.MediaType,
                            IsFolder: false

                        }, item.ChannelName));
                    } else {
                        lines.push(item.ChannelName || '&nbsp;');
                    }
                }

                if (options.showCurrentProgram && item.Type === 'TvChannel') {

                    if (item.CurrentProgram) {
                        lines.push(item.CurrentProgram.Name);
                    } else {
                        lines.push('');
                    }
                }

                if (options.showCurrentProgramTime && item.Type === 'TvChannel') {

                    if (item.CurrentProgram) {
                        lines.push(getAirTimeText(item.CurrentProgram, false, true) || '');
                    } else {
                        lines.push('');
                    }
                }

                if (options.showSeriesTimerTime) {
                    if (item.RecordAnyTime) {

                        lines.push(globalize.translate('Anytime'));
                    } else {
                        lines.push(datetime.getDisplayTime(item.StartDate));
                    }
                }

                if (options.showSeriesTimerChannel) {
                    if (item.RecordAnyChannel) {
                        lines.push(globalize.translate('AllChannels'));
                    } else {
                        lines.push(item.ChannelName || globalize.translate('OneChannel'));
                    }
                }

                if (options.showPersonRoleOrType) {
                    if (item.Role) {
                        lines.push(globalize.translate('PersonRole', item.Role));
                    }
                }
            }

            if ((showTitle || !imgUrl) && forceName && overlayText && lines.length === 1) {
                lines = [];
            }

            const addRightTextMargin = isOuterFooter && options.cardLayout && !options.centerText && options.cardFooterAside !== 'none' && layoutManager.mobile;

            html += getCardTextLines(lines, cssClass, !options.overlayText, isOuterFooter, options.cardLayout, addRightTextMargin, options.lines);

            if (progressHtml) {
                html += progressHtml;
            }

            if (html) {

                if (!isOuterFooter || logoUrl || options.cardLayout) {
                    html = '<div class="' + footerClass + '">' + html;

                    //cardFooter
                    html += '</div>';
                }
            }

            return html;
        }

        /**
         * Generates the HTML markup for the action button.
         * @param {Object} item - Item used to generate the action button.
         * @param {string} text - Text of the action button.
         * @param {string} serverId - ID of the server.
         * @returns {string} HTML markup of the action button.
         */
        function getTextActionButton(item, text, serverId) {
            if (!text) {
                text = itemHelper.getDisplayName(item);
            }

            if (layoutManager.tv) {
                return text;
            }

            let html = '<button ' + itemShortcuts.getShortcutAttributesHtml(item, serverId) + ' type="button" class="itemAction textActionButton" title="' + text + '" data-action="link">';
            html += text;
            html += '</button>';

            return html;
        }

        /**
         * Generates HTML markup for the item count indicator.
         * @param {Object} options - Options used to generate the item count.
         * @param {Object} item - Item used to generate the item count.
         * @returns {string} HTML markup for the item count indicator.
         */
        function getItemCountsHtml(options, item) {
            let counts = [];
            let childText;

            if (item.Type === 'Playlist') {

                childText = '';

                if (item.RunTimeTicks) {

                    let minutes = item.RunTimeTicks / 600000000;

                    minutes = minutes || 1;

                    childText += globalize.translate('ValueMinutes', Math.round(minutes));

                } else {
                    childText += globalize.translate('ValueMinutes', 0);
                }

                counts.push(childText);

            } else if (item.Type === 'Genre' || item.Type === 'Studio') {

                if (item.MovieCount) {

                    childText = item.MovieCount === 1 ?
                        globalize.translate('ValueOneMovie') :
                        globalize.translate('ValueMovieCount', item.MovieCount);

                    counts.push(childText);
                }

                if (item.SeriesCount) {

                    childText = item.SeriesCount === 1 ?
                        globalize.translate('ValueOneSeries') :
                        globalize.translate('ValueSeriesCount', item.SeriesCount);

                    counts.push(childText);
                }
                if (item.EpisodeCount) {

                    childText = item.EpisodeCount === 1 ?
                        globalize.translate('ValueOneEpisode') :
                        globalize.translate('ValueEpisodeCount', item.EpisodeCount);

                    counts.push(childText);
                }

            } else if (item.Type === 'MusicGenre' || options.context === 'MusicArtist') {

                if (item.AlbumCount) {

                    childText = item.AlbumCount === 1 ?
                        globalize.translate('ValueOneAlbum') :
                        globalize.translate('ValueAlbumCount', item.AlbumCount);

                    counts.push(childText);
                }
                if (item.SongCount) {

                    childText = item.SongCount === 1 ?
                        globalize.translate('ValueOneSong') :
                        globalize.translate('ValueSongCount', item.SongCount);

                    counts.push(childText);
                }
                if (item.MusicVideoCount) {

                    childText = item.MusicVideoCount === 1 ?
                        globalize.translate('ValueOneMusicVideo') :
                        globalize.translate('ValueMusicVideoCount', item.MusicVideoCount);

                    counts.push(childText);
                }

            } else if (item.Type === 'Series') {

                childText = item.RecursiveItemCount === 1 ?
                    globalize.translate('ValueOneEpisode') :
                    globalize.translate('ValueEpisodeCount', item.RecursiveItemCount);

                counts.push(childText);
            }

            return counts.join(', ');
        }

        let refreshIndicatorLoaded;

        /**
         * Imports the refresh indicator element.
         */
        function requireRefreshIndicator() {
            if (!refreshIndicatorLoaded) {
                refreshIndicatorLoaded = true;
                require(['emby-itemrefreshindicator']);
            }
        }

        /**
         * Returns the default background class for a card based on a string.
         * @param {string} str - Text used to generate the background class.
         * @returns {string} CSS classes for default card backgrounds.
         */
        export function getDefaultBackgroundClass(str) {
            return 'defaultCardBackground defaultCardBackground' + getDefaultColorIndex(str);
        }

        /**
         * Builds the HTML markup for an individual card.
         * @param {number} index - Index of the card
         * @param {object} item - Item used to generate the card.
         * @param {object} apiClient - API client instance.
         * @param {object} options - Options used to generate the card.
         * @returns {string} HTML markup for the generated card.
         */
        function buildCard(index, item, apiClient, options) {
            let action = options.action || 'link';

            if (action === 'play' && item.IsFolder) {
                // If this hard-coding is ever removed make sure to test nested photo albums
                action = 'link';
            } else if (item.MediaType === 'Photo') {
                action = 'play';
            }

            let shape = options.shape;

            if (shape === 'mixed') {

                shape = null;

                const primaryImageAspectRatio = item.PrimaryImageAspectRatio;

                if (primaryImageAspectRatio) {

                    if (primaryImageAspectRatio >= 1.33) {
                        shape = 'mixedBackdrop';
                    } else if (primaryImageAspectRatio > 0.71) {
                        shape = 'mixedSquare';
                    } else {
                        shape = 'mixedPortrait';
                    }
                }

                shape = shape || 'mixedSquare';
            }

            // TODO move card creation code to Card component

            let className = 'card';

            if (shape) {
                className += ' ' + shape + 'Card';
            }

            if (options.cardCssClass) {
                className += ' ' + options.cardCssClass;
            }

            if (options.cardClass) {
                className += ' ' + options.cardClass;
            }

            if (layoutManager.desktop) {
                className += ' card-hoverable';
            }

            if (layoutManager.tv) {
                className += ' show-focus';

                if (enableFocusTransform) {
                    className += ' show-animation';
                }
            }

            const imgInfo = getCardImageUrl(item, apiClient, options, shape);
            const imgUrl = imgInfo.imgUrl;
            const blurhash = imgInfo.blurhash;

            const forceName = imgInfo.forceName;

            const showTitle = options.showTitle === 'auto' ? true : (options.showTitle || item.Type === 'PhotoAlbum' || item.Type === 'Folder');
            const overlayText = options.overlayText;

            let cardImageContainerClass = 'cardImageContainer';
            const coveredImage = options.coverImage || imgInfo.coverImage;

            if (coveredImage) {
                cardImageContainerClass += ' coveredImage';

                if (item.MediaType === 'Photo' || item.Type === 'PhotoAlbum' || item.Type === 'Folder' || item.ProgramInfo || item.Type === 'Program' || item.Type === 'Recording') {
                    cardImageContainerClass += ' coveredImage-noScale';
                }
            }

            if (!imgUrl) {
                cardImageContainerClass += ' ' + getDefaultBackgroundClass(item.Name);
            }

            let cardBoxClass = options.cardLayout ? 'cardBox visualCardBox' : 'cardBox';

            let footerCssClass;
            let progressHtml = indicators.getProgressBarHtml(item);

            let innerCardFooter = '';

            let footerOverlayed = false;

            let logoUrl;
            const logoHeight = 40;

            if (options.showChannelLogo && item.ChannelPrimaryImageTag) {
                logoUrl = apiClient.getScaledImageUrl(item.ChannelId, {
                    type: 'Primary',
                    height: logoHeight,
                    tag: item.ChannelPrimaryImageTag
                });
            } else if (options.showLogo && item.ParentLogoImageTag) {
                logoUrl = apiClient.getScaledImageUrl(item.ParentLogoItemId, {
                    type: 'Logo',
                    height: logoHeight,
                    tag: item.ParentLogoImageTag
                });
            }

            if (overlayText) {

                logoUrl = null;

                footerCssClass = progressHtml ? 'innerCardFooter fullInnerCardFooter' : 'innerCardFooter';
                innerCardFooter += getCardFooterText(item, apiClient, options, showTitle, forceName, overlayText, imgUrl, footerCssClass, progressHtml, logoUrl, false);
                footerOverlayed = true;
            } else if (progressHtml) {
                innerCardFooter += '<div class="innerCardFooter fullInnerCardFooter innerCardFooterClear">';
                innerCardFooter += progressHtml;
                innerCardFooter += '</div>';

                progressHtml = '';
            }

            const mediaSourceCount = item.MediaSourceCount || 1;
            if (mediaSourceCount > 1 && options.disableIndicators !== true) {
                innerCardFooter += '<div class="mediaSourceIndicator">' + mediaSourceCount + '</div>';
            }

            let outerCardFooter = '';
            if (!overlayText && !footerOverlayed) {
                footerCssClass = options.cardLayout ? 'cardFooter' : 'cardFooter cardFooter-transparent';

                if (logoUrl) {
                    footerCssClass += ' cardFooter-withlogo';
                }

                if (!options.cardLayout) {
                    logoUrl = null;
                }

                outerCardFooter = getCardFooterText(item, apiClient, options, showTitle, forceName, overlayText, imgUrl, footerCssClass, progressHtml, logoUrl, true);
            }

            if (outerCardFooter && !options.cardLayout) {
                cardBoxClass += ' cardBox-bottompadded';
            }

            let overlayButtons = '';
            if (layoutManager.mobile) {
                let overlayPlayButton = options.overlayPlayButton;

                if (overlayPlayButton == null && !options.overlayMoreButton && !options.overlayInfoButton && !options.cardLayout) {
                    overlayPlayButton = item.MediaType === 'Video';
                }

                const btnCssClass = 'cardOverlayButton cardOverlayButton-br itemAction';

                if (options.centerPlayButton) {
                    overlayButtons += '<button is="paper-icon-button-light" class="' + btnCssClass + ' cardOverlayButton-centered" data-action="play"><span class="material-icons cardOverlayButtonIcon play_arrow"></span></button>';
                }

                if (overlayPlayButton && !item.IsPlaceHolder && (item.LocationType !== 'Virtual' || !item.MediaType || item.Type === 'Program') && item.Type !== 'Person') {
                    overlayButtons += '<button is="paper-icon-button-light" class="' + btnCssClass + '" data-action="play"><span class="material-icons cardOverlayButtonIcon play_arrow"></span></button>';
                }

                if (options.overlayMoreButton) {
                    overlayButtons += '<button is="paper-icon-button-light" class="' + btnCssClass + '" data-action="menu"><span class="material-icons cardOverlayButtonIcon more_vert"></span></button>';
                }
            }

            if (options.showChildCountIndicator && item.ChildCount) {
                className += ' groupedCard';
            }

            // cardBox can be it's own separate element if an outer footer is ever needed
            let cardImageContainerOpen;
            let cardImageContainerClose = '';
            let cardBoxClose = '';
            let cardScalableClose = '';

            let cardContentClass = 'cardContent';

            let blurhashAttrib = '';
            if (blurhash && blurhash.length > 0) {
                blurhashAttrib = 'data-blurhash="' + blurhash + '"';
            }

            if (layoutManager.tv) {
                // Don't use the IMG tag with safari because it puts a white border around it
                cardImageContainerOpen = imgUrl ? ('<div class="' + cardImageContainerClass + ' ' + cardContentClass + ' lazy" data-src="' + imgUrl + '" ' + blurhashAttrib + '>') : ('<div class="' + cardImageContainerClass + ' ' + cardContentClass + '">');

                cardImageContainerClose = '</div>';
            } else {
                // Don't use the IMG tag with safari because it puts a white border around it
                cardImageContainerOpen = imgUrl ? ('<button data-action="' + action + '" class="' + cardImageContainerClass + ' ' + cardContentClass + ' itemAction lazy" data-src="' + imgUrl + '" ' + blurhashAttrib + '>') : ('<button data-action="' + action + '" class="' + cardImageContainerClass + ' ' + cardContentClass + ' itemAction">');

                cardImageContainerClose = '</button>';
            }

            let cardScalableClass = 'cardScalable';

            cardImageContainerOpen = '<div class="' + cardBoxClass + '"><div class="' + cardScalableClass + '"><div class="cardPadder cardPadder-' + shape + '"></div>' + cardImageContainerOpen;
            cardBoxClose = '</div>';
            cardScalableClose = '</div>';

            if (options.disableIndicators !== true) {
                let indicatorsHtml = '';

                if (options.missingIndicator !== false) {
                    indicatorsHtml += indicators.getMissingIndicator(item);
                }

                indicatorsHtml += indicators.getSyncIndicator(item);
                indicatorsHtml += indicators.getTimerIndicator(item);

                indicatorsHtml += indicators.getTypeIndicator(item);

                if (options.showGroupCount) {

                    indicatorsHtml += indicators.getChildCountIndicatorHtml(item, {
                        minCount: 1
                    });
                } else {
                    indicatorsHtml += indicators.getPlayedIndicatorHtml(item);
                }

                if (item.Type === 'CollectionFolder' || item.CollectionType) {
                    const refreshClass = item.RefreshProgress ? '' : ' class="hide"';
                    indicatorsHtml += '<div is="emby-itemrefreshindicator"' + refreshClass + ' data-progress="' + (item.RefreshProgress || 0) + '" data-status="' + item.RefreshStatus + '"></div>';
                    requireRefreshIndicator();
                }

                if (indicatorsHtml) {
                    cardImageContainerOpen += '<div class="cardIndicators">' + indicatorsHtml + '</div>';
                }
            }

            if (!imgUrl) {
                cardImageContainerOpen += getDefaultText(item, options);
            }

            const tagName = (layoutManager.tv) && !overlayButtons ? 'button' : 'div';

            const nameWithPrefix = (item.SortName || item.Name || '');
            let prefix = nameWithPrefix.substring(0, Math.min(3, nameWithPrefix.length));

            if (prefix) {
                prefix = prefix.toUpperCase();
            }

            let timerAttributes = '';
            if (item.TimerId) {
                timerAttributes += ' data-timerid="' + item.TimerId + '"';
            }
            if (item.SeriesTimerId) {
                timerAttributes += ' data-seriestimerid="' + item.SeriesTimerId + '"';
            }

            let actionAttribute;

            if (tagName === 'button') {
                className += ' itemAction';
                actionAttribute = ' data-action="' + action + '"';
            } else {
                actionAttribute = '';
            }

            if (item.Type !== 'MusicAlbum' && item.Type !== 'MusicArtist' && item.Type !== 'Audio') {
                className += ' card-withuserdata';
            }

            const positionTicksData = item.UserData && item.UserData.PlaybackPositionTicks ? (' data-positionticks="' + item.UserData.PlaybackPositionTicks + '"') : '';
            const collectionIdData = options.collectionId ? (' data-collectionid="' + options.collectionId + '"') : '';
            const playlistIdData = options.playlistId ? (' data-playlistid="' + options.playlistId + '"') : '';
            const mediaTypeData = item.MediaType ? (' data-mediatype="' + item.MediaType + '"') : '';
            const collectionTypeData = item.CollectionType ? (' data-collectiontype="' + item.CollectionType + '"') : '';
            const channelIdData = item.ChannelId ? (' data-channelid="' + item.ChannelId + '"') : '';
            const contextData = options.context ? (' data-context="' + options.context + '"') : '';
            const parentIdData = options.parentId ? (' data-parentid="' + options.parentId + '"') : '';

            let additionalCardContent = '';

            if (layoutManager.desktop) {
                additionalCardContent += getHoverMenuHtml(item, action, options);
            }

            return '<' + tagName + ' data-index="' + index + '"' + timerAttributes + actionAttribute + ' data-isfolder="' + (item.IsFolder || false) + '" data-serverid="' + (item.ServerId || options.serverId) + '" data-id="' + (item.Id || item.ItemId) + '" data-type="' + item.Type + '"' + mediaTypeData + collectionTypeData + channelIdData + positionTicksData + collectionIdData + playlistIdData + contextData + parentIdData + ' data-prefix="' + prefix + '" class="' + className + '">' + cardImageContainerOpen + innerCardFooter + cardImageContainerClose + overlayButtons + additionalCardContent + cardScalableClose + outerCardFooter + cardBoxClose + '</' + tagName + '>';
        }

        /**
         * Generates HTML markup for the card overlay.
         * @param {object} item - Item used to generate the card overlay.
         * @param {string} action - Action assigned to the overlay.
         * @param {Array} options - Card builder options.
         * @returns {string} HTML markup of the card overlay.
         */
        function getHoverMenuHtml(item, action, options) {
            let html = '';

            html += '<div class="cardOverlayContainer itemAction" data-action="' + action + '">';

            const btnCssClass = 'cardOverlayButton cardOverlayButton-hover itemAction paper-icon-button-light';

            if (playbackManager.canPlay(item)) {
                html += '<button is="paper-icon-button-light" class="' + btnCssClass + ' cardOverlayFab-primary" data-action="resume"><span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover play_arrow"></span></button>';
            }

            html += '<div class="cardOverlayButton-br flex">';

            const userData = item.UserData || {};

            if (itemHelper.canMarkPlayed(item) && !options.disableHoverMenu) {
                require(['emby-playstatebutton']);
                html += '<button is="emby-playstatebutton" type="button" data-action="none" class="' + btnCssClass + '" data-id="' + item.Id + '" data-serverid="' + item.ServerId + '" data-itemtype="' + item.Type + '" data-played="' + (userData.Played) + '"><span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover check"></span></button>';
            }

            if (itemHelper.canRate(item) && !options.disableHoverMenu) {

                const likes = userData.Likes == null ? '' : userData.Likes;

                require(['emby-ratingbutton']);
                html += '<button is="emby-ratingbutton" type="button" data-action="none" class="' + btnCssClass + '" data-id="' + item.Id + '" data-serverid="' + item.ServerId + '" data-itemtype="' + item.Type + '" data-likes="' + likes + '" data-isfavorite="' + (userData.IsFavorite) + '"><span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover favorite"></span></button>';
            }

            if (!options.disableHoverMenu) {
                html += '<button is="paper-icon-button-light" class="' + btnCssClass + '" data-action="menu"><span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover more_vert"></span></button>';
            }

            html += '</div>';
            html += '</div>';

            return html;
        }

        /**
         * Generates the text or icon used for default card backgrounds.
         * @param {object} item - Item used to generate the card overlay.
         * @param {object} options - Options used to generate the card overlay.
         * @returns {string} HTML markup of the card overlay.
         */
        export function getDefaultText(item, options) {
            if (item.CollectionType) {
                return '<span class="cardImageIcon material-icons ' + imageHelper.getLibraryIcon(item.CollectionType) + '"></span>';
            }

            switch (item.Type) {
                case 'MusicAlbum':
                    return '<span class="cardImageIcon material-icons album"></span>';
                case 'MusicArtist':
                case 'Person':
                    return '<span class="cardImageIcon material-icons person"></span>';
                case 'Audio':
                    return '<span class="cardImageIcon material-icons audiotrack"></span>';
                case 'Movie':
                    return '<span class="cardImageIcon material-icons movie"></span>';
                case 'Series':
                    return '<span class="cardImageIcon material-icons tv"></span>';
                case 'Book':
                    return '<span class="cardImageIcon material-icons book"></span>';
                case 'Folder':
                    return '<span class="cardImageIcon material-icons folder"></span>';
                case 'BoxSet':
                    return '<span class="cardImageIcon material-icons collections"></span>';
                case 'Playlist':
                    return '<span class="cardImageIcon material-icons view_list"></span>';
                case 'PhotoAlbum':
                    return '<span class="cardImageIcon material-icons photo_album"></span>';
            }

            if (options && options.defaultCardImageIcon) {
                return '<span class="cardImageIcon material-icons ' + options.defaultCardImageIcon + '"></span>';
            }

            const defaultName = isUsingLiveTvNaming(item) ? item.Name : itemHelper.getDisplayName(item);
            return '<div class="cardText cardDefaultText">' + defaultName + '</div>';
        }

        /**
         * Builds a set of cards and inserts them into the page.
         * @param {Array} items - Array of items used to build the cards.
         * @param {options} options - Options of the cards to build.
         */
        export function buildCards(items, options) {
            // Abort if the container has been disposed
            if (!document.body.contains(options.itemsContainer)) {
                return;
            }

            if (options.parentContainer) {
                if (items.length) {
                    options.parentContainer.classList.remove('hide');
                } else {
                    options.parentContainer.classList.add('hide');
                    return;
                }
            }

            const html = buildCardsHtmlInternal(items, options);

            if (html) {

                if (options.itemsContainer.cardBuilderHtml !== html) {
                    options.itemsContainer.innerHTML = html;

                    if (items.length < 50) {
                        options.itemsContainer.cardBuilderHtml = html;
                    } else {
                        options.itemsContainer.cardBuilderHtml = null;
                    }
                }

                imageLoader.lazyChildren(options.itemsContainer);
            } else {

                options.itemsContainer.innerHTML = html;
                options.itemsContainer.cardBuilderHtml = null;
            }

            if (options.autoFocus) {
                focusManager.autoFocus(options.itemsContainer, true);
            }
        }

        /**
         * Ensures the indicators for a card exist and creates them if they don't exist.
         * @param {HTMLDivElement} card - DOM element of the card.
         * @param {HTMLDivElement} indicatorsElem - DOM element of the indicators.
         * @returns {HTMLDivElement} - DOM element of the indicators.
         */
        function ensureIndicators(card, indicatorsElem) {
            if (indicatorsElem) {
                return indicatorsElem;
            }

            indicatorsElem = card.querySelector('.cardIndicators');

            if (!indicatorsElem) {

                const cardImageContainer = card.querySelector('.cardImageContainer');
                indicatorsElem = document.createElement('div');
                indicatorsElem.classList.add('cardIndicators');
                cardImageContainer.appendChild(indicatorsElem);
            }

            return indicatorsElem;
        }

        /**
         * Adds user data to the card such as progress indicators and played status.
         * @param {HTMLDivElement} card - DOM element of the card.
         * @param {Object} userData - User data to apply to the card.
         */
        function updateUserData(card, userData) {
            const type = card.getAttribute('data-type');
            const enableCountIndicator = type === 'Series' || type === 'BoxSet' || type === 'Season';
            let indicatorsElem = null;
            let playedIndicator = null;
            let countIndicator = null;
            let itemProgressBar = null;

            if (userData.Played) {

                playedIndicator = card.querySelector('.playedIndicator');

                if (!playedIndicator) {

                    playedIndicator = document.createElement('div');
                    playedIndicator.classList.add('playedIndicator');
                    playedIndicator.classList.add('indicator');
                    indicatorsElem = ensureIndicators(card, indicatorsElem);
                    indicatorsElem.appendChild(playedIndicator);
                }
                playedIndicator.innerHTML = '<span class="material-icons indicatorIcon check"></span>';
            } else {

                playedIndicator = card.querySelector('.playedIndicator');
                if (playedIndicator) {

                    playedIndicator.parentNode.removeChild(playedIndicator);
                }
            }
            if (userData.UnplayedItemCount) {
                countIndicator = card.querySelector('.countIndicator');

                if (!countIndicator) {

                    countIndicator = document.createElement('div');
                    countIndicator.classList.add('countIndicator');
                    indicatorsElem = ensureIndicators(card, indicatorsElem);
                    indicatorsElem.appendChild(countIndicator);
                }
                countIndicator.innerHTML = userData.UnplayedItemCount;
            } else if (enableCountIndicator) {

                countIndicator = card.querySelector('.countIndicator');
                if (countIndicator) {

                    countIndicator.parentNode.removeChild(countIndicator);
                }
            }

            const progressHtml = indicators.getProgressBarHtml({
                Type: type,
                UserData: userData,
                MediaType: 'Video'
            });

            if (progressHtml) {

                itemProgressBar = card.querySelector('.itemProgressBar');

                if (!itemProgressBar) {
                    itemProgressBar = document.createElement('div');
                    itemProgressBar.classList.add('itemProgressBar');

                    let innerCardFooter = card.querySelector('.innerCardFooter');
                    if (!innerCardFooter) {
                        innerCardFooter = document.createElement('div');
                        innerCardFooter.classList.add('innerCardFooter');
                        const cardImageContainer = card.querySelector('.cardImageContainer');
                        cardImageContainer.appendChild(innerCardFooter);
                    }
                    innerCardFooter.appendChild(itemProgressBar);
                }

                itemProgressBar.innerHTML = progressHtml;
            } else {

                itemProgressBar = card.querySelector('.itemProgressBar');
                if (itemProgressBar) {
                    itemProgressBar.parentNode.removeChild(itemProgressBar);
                }
            }
        }

        /**
         * Handles when user data has changed.
         * @param {Object} userData - User data to apply to the card.
         * @param {HTMLElement} scope - DOM element to use as a scope when selecting cards.
         */
        export function onUserDataChanged(userData, scope) {
            const cards = (scope || document.body).querySelectorAll('.card-withuserdata[data-id="' + userData.ItemId + '"]');

            for (let i = 0, length = cards.length; i < length; i++) {
                updateUserData(cards[i], userData);
            }
        }

        /**
         * Handles when a timer has been created.
         * @param {string} programId - ID of the program.
         * @param {string} newTimerId - ID of the new timer.
         * @param {HTMLElement} itemsContainer - DOM element of the itemsContainer.
         */
        export function onTimerCreated(programId, newTimerId, itemsContainer) {
            const cells = itemsContainer.querySelectorAll('.card[data-id="' + programId + '"]');

            for (let i = 0, length = cells.length; i < length; i++) {
                let cell = cells[i];
                const icon = cell.querySelector('.timerIndicator');
                if (!icon) {
                    const indicatorsElem = ensureIndicators(cell);
                    indicatorsElem.insertAdjacentHTML('beforeend', '<span class="material-icons timerIndicator indicatorIcon fiber_manual_record"></span>');
                }
                cell.setAttribute('data-timerid', newTimerId);
            }
        }

        /**
         * Handles when a timer has been cancelled.
         * @param {string} timerId - ID of the cancelled timer.
         * @param {HTMLElement} itemsContainer - DOM element of the itemsContainer.
         */
        export function onTimerCancelled(timerId, itemsContainer) {
            const cells = itemsContainer.querySelectorAll('.card[data-timerid="' + timerId + '"]');

            for (let i = 0; i < cells.length; i++) {
                let cell = cells[i];
                let icon = cell.querySelector('.timerIndicator');
                if (icon) {
                    icon.parentNode.removeChild(icon);
                }
                cell.removeAttribute('data-timerid');
            }
        }

        /**
         * Handles when a series timer has been cancelled.
         * @param {string} cancelledTimerId - ID of the cancelled timer.
         * @param {HTMLElement} itemsContainer - DOM element of the itemsContainer.
         */
        export function onSeriesTimerCancelled(cancelledTimerId, itemsContainer) {
            const cells = itemsContainer.querySelectorAll('.card[data-seriestimerid="' + cancelledTimerId + '"]');

            for (let i = 0; i < cells.length; i++) {
                let cell = cells[i];
                let icon = cell.querySelector('.timerIndicator');
                if (icon) {
                    icon.parentNode.removeChild(icon);
                }
                cell.removeAttribute('data-seriestimerid');
            }
        }

/* eslint-enable indent */

export default {
    getCardsHtml: getCardsHtml,
    getDefaultBackgroundClass: getDefaultBackgroundClass,
    getDefaultText: getDefaultText,
    buildCards: buildCards,
    onUserDataChanged: onUserDataChanged,
    onTimerCreated: onTimerCreated,
    onTimerCancelled: onTimerCancelled,
    onSeriesTimerCancelled: onSeriesTimerCancelled
};
